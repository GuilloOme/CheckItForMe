(function () {
    'use strict';

    function RaffleService() {
        var TOTAL_ENTRY_THRESHOLD = 300,
            RAFFLE_COUNT_THRESHOLD = 15,
            TIME_LEFT_THRESHOLD = 3600;// in sec: 5400 = 1½hour

        var goodRaffleList = [],
            badRaffleList = [];

        function isRaffleWorthIt(raffle) {
            var isIt = false;

            if (raffle.count > 0) {
                if (raffle.haveSpecials) {
                    isIt = true;
                } else if (raffle.totalEntries <= TOTAL_ENTRY_THRESHOLD) {
                    isIt = true;
                } else if (raffle.count >= RAFFLE_COUNT_THRESHOLD) {
                    isIt = true;
                } else if (raffle.timeLeft < TIME_LEFT_THRESHOLD) {
                    isIt = true;
                }
            }

            return isIt;
        }


        return {
            isRaffleWorthIt: isRaffleWorthIt,
            goodList: goodRaffleList,
            badList: badRaffleList
        };

    }

    exports.RaffleService = new RaffleService();
})();
