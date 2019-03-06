'use strict';

System.register(['./sha1'], function (_export, _context) {
    "use strict";

    var SHA, _createClass, CmsSigner;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_sha) {
            SHA = _sha.SHA;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export('CmsSigner', CmsSigner = function () {
                function CmsSigner(credentials, request) {
                    _classCallCheck(this, CmsSigner);

                    this.credentials = credentials;
                    this.request = request;
                }

                _createClass(CmsSigner, [{
                    key: 'addAuthorization',
                    value: function addAuthorization() {
                        var date = new Date();
                        var globalQuery = {
                            'Format': 'JSON',
                            'Version': '2018-03-08',
                            'AccessKeyId': this.credentials.accessKeyId,
                            'SignatureMethod': 'HMAC-SHA1',
                            'SignatureVersion': '1.0',
                            'SignatureNonce': String(date.getTime()) + this.randomNumbers(4),
                            'Timestamp': date.toISOString().replace(/\.\d{3}/, '')
                        };

                        var parts = [];
                        Object.keys(globalQuery).forEach(function (key) {
                            parts.push(key + '=' + encodeURIComponent(globalQuery[key]));
                        });
                        this.request.path += (this.request.path.indexOf('?') == -1 ? '?' : '&') + parts.join('&');
                        var signature = this.sign(this.credentials.secretAccessKey, this.stringToSign());
                        this.request.path += '&Signature=' + encodeURIComponent(signature);
                    }
                }, {
                    key: 'randomNumbers',
                    value: function randomNumbers(count) {
                        var num = '';
                        for (var i = 0; i < count; i++) {
                            num += Math.floor(Math.random() * 10);
                        }
                        return num;
                    }
                }, {
                    key: 'stringToSign',
                    value: function stringToSign() {
                        var r = this.request;
                        var s = r.method + '&%2F&' + encodeURIComponent(this.canonicalizedQueryString());
                        return s;
                    }
                }, {
                    key: 'canonicalizedQueryString',
                    value: function canonicalizedQueryString() {
                        var that = this;
                        var r = this.request;
                        var querystring = r.path.split('?')[1];
                        var resource = '';
                        if (r.body) {
                            querystring += '&' + r.body;
                        }
                        if (querystring) {
                            var resources = [];
                            this.arrayEach.call(this, querystring.split('&'), function (param) {
                                var pos = param.indexOf('=');
                                var name = param.slice(0, pos);
                                var value = param.slice(pos + 1);
                                var resource = { name: name };
                                if (value !== undefined) {
                                    resource.value = decodeURIComponent(value);
                                }
                                resources.push(resource);
                            });
                            resources.sort(function (a, b) {
                                return a.name < b.name ? -1 : 1;
                            });
                            if (resources.length) {
                                querystring = [];
                                this.arrayEach(resources, function (resource) {
                                    if (resource.value === undefined) querystring.push(that.cmsEscape(resource.name));else querystring.push(that.cmsEscape(resource.name) + '=' + that.cmsEscape(resource.value));
                                });
                                resource += querystring.join('&');
                            }
                        }
                        return resource;
                    }
                }, {
                    key: 'arrayEach',
                    value: function arrayEach(array, iterFunction) {
                        for (var idx in array) {
                            if (array.hasOwnProperty(idx)) {
                                var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
                                if (ret === {}) break;
                            }
                        }
                    }
                }, {
                    key: 'cmsEscape',
                    value: function cmsEscape(clearString) {
                        return encodeURIComponent(clearString).replace(/\!/gi, '%21').replace(/\'/gi, '%27').replace(/\(/gi, '%28').replace(/\)/gi, '%29').replace(/\*/gi, '%2A');
                    }
                }, {
                    key: 'sign',
                    value: function sign(secret, string) {
                        return this.hmac(secret + '&', string, 'base64', 'sha1');
                    }
                }, {
                    key: 'hmac',
                    value: function hmac(key, string, digest, fn) {
                        if (!digest) digest = 'binary';

                        if (digest === 'buffer') {
                            digest = undefined;
                            // todo: 不支持 buffer 类型的 hash
                            return "";
                        }

                        if (!fn) fn = 'sha256';

                        if (typeof string != 'string') {
                            //string = new Buffer(string);
                            // todo: 目前只支持 string
                            return "";
                        }
                        var jsSHA = SHA();
                        var shaObj;
                        switch (fn) {
                            case "md5":
                                // todo: 不支持 md5
                                return "";
                            case "sha1":
                                shaObj = new jsSHA("SHA-1", "TEXT");
                                break;
                            case "sha256":
                                shaObj = new jsSHA("SHA-256", "TEXT");
                                break;
                            case "sha512":
                                shaObj = new jsSHA("SHA-512", "TEXT");
                                break;
                            default:
                                return "";
                        }

                        shaObj.setHMACKey(key, "TEXT");

                        shaObj.update(string);

                        switch (digest) {
                            case "binary":
                                return shaObj.getHMAC("BYTES");
                            case "hex":
                                return shaObj.getHMAC("HEX");
                            case "base64":
                                return shaObj.getHMAC("B64");
                            default:
                                return "";
                        }
                    }
                }]);

                return CmsSigner;
            }());

            _export('CmsSigner', CmsSigner);
        }
    };
});
//# sourceMappingURL=signer.js.map
