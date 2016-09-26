(function () {
    'use strict';
    function IntervalHelper() {

        function randomInterval(delay) {
            if (!delay) {
                delay = 0.5;
            }
            return Math.floor(delay * 1000) + Math.floor(Math.random() * (delay * 1000));
        }

        function safeReloadRoutine(delay) {
            setTimeout(function () {
                location.reload();
            }, delay * 1000);
        }

        return {
            randomInterval: randomInterval,
            safeReloadRoutine: safeReloadRoutine
        };
    }

    exports.IntervalHelper = new IntervalHelper();

})();
