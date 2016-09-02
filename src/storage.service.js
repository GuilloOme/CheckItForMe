(function () {
    'use strict';
    function StorageService() {


        function store(key, value) {
            if (_haveStorageSupport()) {
                localStorage[key] = JSON.stringify(value);
            }
        }

        function extract(key) {
            var result = undefined;
            if (_haveStorageSupport() && localStorage[key]) {
                result = JSON.parse(localStorage[key]);
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
