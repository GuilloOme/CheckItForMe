(function () {
    'use strict';
    function IntervalHelper() {

        function randomInterval(delay) {
            if (!delay) {
                delay = 0.5;
            }
            return Math.floor(delay * 1000) + Math.floor(Math.random() * (delay * 1000));
        }

        return {

            randomInterval: randomInterval
        };
    }

    exports.IntervalHelper = new IntervalHelper();

})();
