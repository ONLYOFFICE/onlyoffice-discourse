# frozen_string_literal: true

module Onlyoffice
  module ControllerExtensions
    def convert
      unless check_trust_level_access
        return render json: { error: "Insufficient trust level" }, status: :forbidden
      end

      begin
        service =
          Onlyoffice::ConversionService.new(
            upload_short_url: params[:upload_short_url],
            target_format: params[:target_format],
          )

        result = service.convert
        render json: result
      rescue => e
        render json: { error: e.message }, status: :internal_server_error
      end
    end

    def upload_info
      unless check_trust_level_access
        return render json: { error: "Insufficient trust level" }, status: :forbidden
      end

      upload_short_url = params[:id]

      upload = nil
      PrettyText::Helpers
        .lookup_upload_urls([upload_short_url])
        .each do |short_url, paths|
          if paths[:base62_sha1]
            sha1 = Upload.sha1_from_base62_encoded(paths[:base62_sha1])
            upload = Upload.find_by(sha1: sha1)
          elsif paths[:sha1]
            upload = Upload.find_by(sha1: paths[:sha1])
          end
        end

      if upload
        # Determine user permission for this upload
        user_permission =
          if current_user
            check_user_permission(upload, current_user)
          else
            "viewer"
          end

        render json: {
                 upload_id: upload.id,
                 user_id: upload.user_id,
                 user_permission: user_permission,
               }
      else
        render json: { error: "Upload not found" }, status: :not_found
      end
    end

    def list_permissions
      upload = find_upload_by_short_url(params[:id])
      return render json: { error: "Upload not found" }, status: :not_found unless upload
      unless can_manage_permissions?(upload)
        return render json: { error: "Access denied" }, status: :forbidden
      end

      permissions = Onlyoffice::Permission.where(upload_id: upload.id).includes(:user)
      doc_settings =
        Onlyoffice::DocumentSetting.find_or_create_by(upload_id: upload.id) do |settings|
          settings.default_can_edit = false
        end

      render json: {
               permissions:
                 permissions.map do |p|
                   {
                     id: p.id,
                     user: {
                       id: p.user.id,
                       username: p.user.username,
                       name: p.user.name,
                       avatar_template: p.user.avatar_template,
                     },
                     permission_type: p.permission_type,
                   }
                 end,
               default_can_edit: doc_settings.default_can_edit,
             }
    end

    def create_permission
      upload = find_upload_by_short_url(params[:id])
      return render json: { error: "Upload not found" }, status: :not_found unless upload
      unless can_manage_permissions?(upload)
        return render json: { error: "Access denied" }, status: :forbidden
      end

      permission =
        Onlyoffice::Permission.new(
          upload_id: upload.id,
          user_id: params[:user_id],
          permission_type: params[:permission_type],
        )

      if permission.save
        render json: { success: true }
      else
        render json: {
                 error: permission.errors.full_messages.join(", "),
               },
               status: :unprocessable_entity
      end
    end

    def update_permission
      upload = find_upload_by_short_url(params[:id])
      return render json: { error: "Upload not found" }, status: :not_found unless upload
      unless can_manage_permissions?(upload)
        return render json: { error: "Access denied" }, status: :forbidden
      end

      permission = Onlyoffice::Permission.find_by(id: params[:permission_id], upload_id: upload.id)
      return render json: { error: "Permission not found" }, status: :not_found unless permission

      if permission.update(permission_type: params[:permission_type])
        render json: { success: true }
      else
        render json: {
                 error: permission.errors.full_messages.join(", "),
               },
               status: :unprocessable_entity
      end
    end

    def delete_permission
      upload = find_upload_by_short_url(params[:id])
      return render json: { error: "Upload not found" }, status: :not_found unless upload
      unless can_manage_permissions?(upload)
        return render json: { error: "Access denied" }, status: :forbidden
      end

      permission = Onlyoffice::Permission.find_by(id: params[:permission_id], upload_id: upload.id)
      return render json: { error: "Permission not found" }, status: :not_found unless permission

      if permission.destroy
        render json: { success: true }
      else
        render json: { error: "Failed to delete permission" }, status: :internal_server_error
      end
    end

    def update_document_settings
      upload = find_upload_by_short_url(params[:id])
      return render json: { error: "Upload not found" }, status: :not_found unless upload
      unless can_manage_permissions?(upload)
        return render json: { error: "Access denied" }, status: :forbidden
      end

      doc_settings =
        Onlyoffice::DocumentSetting.find_or_create_by(upload_id: upload.id) do |settings|
          settings.default_can_edit = false
        end

      doc_settings.default_can_edit = params[:default_can_edit] if params.key?(:default_can_edit)

      if doc_settings.save
        render json: {
                 success: true,
                 default_can_edit: doc_settings.default_can_edit,
               }
      else
        render json: {
                 error: doc_settings.errors.full_messages.join(", "),
               },
               status: :unprocessable_entity
      end
    end

    private

    def check_trust_level_access
      minimum_trust_level = SiteSetting.ONLYOFFICE_minimum_trust_level

      # If no user is logged in
      unless current_user
        # Only allow if minimum is 0
        return minimum_trust_level.to_s == "0"
      end

      # Check special groups
      case minimum_trust_level.to_s
      when "admin"
        return current_user.admin?
      when "staff"
        return current_user.staff?
      end

      # For numeric trust levels, staff always has access
      return true if current_user.staff?

      # Check numeric trust level
      min_level = minimum_trust_level.to_i
      current_user.trust_level >= min_level
    end

    def find_upload_by_short_url(short_url)
      upload = nil
      PrettyText::Helpers
        .lookup_upload_urls([short_url])
        .each do |_, paths|
          if paths[:base62_sha1]
            sha1 = Upload.sha1_from_base62_encoded(paths[:base62_sha1])
            upload = Upload.find_by(sha1: sha1)
          elsif paths[:sha1]
            upload = Upload.find_by(sha1: paths[:sha1])
          end
        end
      upload
    end

    def check_user_permission(upload, user)
      return "editor" unless upload

      # Owner always has editor rights
      return "editor" if upload.user_id == user.id

      # Check explicit permissions set by owner
      permission = Onlyoffice::Permission.find_by(upload_id: upload.id, user_id: user.id)
      return permission.permission_type if permission

      # Check document-specific default permissions
      doc_settings = Onlyoffice::DocumentSetting.find_by(upload_id: upload.id)
      
      if doc_settings && doc_settings.default_can_edit
        return "editor"
      else
        # If no settings or default_can_edit is false, default to viewer
        return "viewer"
      end
    end

    def can_manage_permissions?(upload)
      return false unless current_user

      # Check if user is post author (if post_id provided)
      if params[:post_id].present?
        post = Post.find_by(id: params[:post_id])
        return true if post && post.user_id == current_user.id
      end

      # Only upload owner can manage permissions
      return true if upload.user_id == current_user.id

      false
    end
  end
end
