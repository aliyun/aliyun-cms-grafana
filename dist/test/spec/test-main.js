'use strict';

System.register(['prunk', 'jsdom', 'chai'], function (_export, _context) {
    "use strict";

    var prunk, jsdom, chai;
    return {
        setters: [function (_prunk) {
            prunk = _prunk.default;
        }, function (_jsdom) {
            jsdom = _jsdom.jsdom;
        }, function (_chai) {
            chai = _chai.default;
        }],
        execute: function () {

            // Mock Grafana modules that are not available outside of the core project
            // Required for loading module.js
            prunk.mock('./css/query-editor.css!', 'no css, dude.');
            prunk.mock('app/plugins/sdk', {
                QueryCtrl: null
            });

            // Setup jsdom
            // Required for loading angularjs
            global.document = jsdom('<html><head><script></script></head><body></body></html>');
            global.window = global.document.parentWindow;

            // Setup Chai
            chai.should();
            global.assert = chai.assert;
            global.expect = chai.expect;
        }
    };
});
//# sourceMappingURL=test-main.js.map
