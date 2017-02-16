(function () {
    'use strict';
    function StorageService() {
        var prefix = 'cifm_';

        function store(key, value) {
            if (_haveStorageSupport()) {
                localStorage[prefix + key] = JSON.stringify(value);
            }
        }

        function extract(key) {
            var result = undefined;
            if (_haveStorageSupport() && typeof localStorage[prefix + key] !== "undefined") {
                result = JSON.parse(localStorage[prefix + key]);
            }

            return result;
        }

        function _haveStorageSupport() {
            return (typeof(Storage) !== "undefined");
        }

        return {
            extract: extract,
            store: store
        };
    }

    exports.StorageService = new StorageService();

})();
