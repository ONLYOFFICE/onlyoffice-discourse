import { ajax } from 'discourse/lib/ajax';

export default Ember.Route.extend({

    queryParams: {
        view: {
            refreshModel: true
        }
    },

    model(params) {
        if (params.view) {
            return ajax(`/onlyoffice/editor/${params.id}.json?view=1`);
        } else {
            return ajax(`/onlyoffice/editor/${params.id}.json`);
        }
    },

    renderTemplate() {
        this.render("onlyoffice.editor", {
            into: "onlyoffice"
        });
    },
});