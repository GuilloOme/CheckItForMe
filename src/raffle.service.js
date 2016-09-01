(function () {
    'use strict';

    var UI = require('./ui.helper').UIHelper;


    function RaffleService() {
        var TOTAL_ENTRY_THRESHOLD = 300,
            RAFFLE_COUNT_THRESHOLD = 15,
            TIME_LEFT_THRESHOLD = 3600, // in sec: 5400 = 1½hour
            WEIGHT_THRESHOLD = 9,
            ITEM_WEIGHT = {
                //MVM Parts
                reinforcedPart: {weight: 0.05, title: 'Reinforced '},
                battleWornPart: {weight: 2, title: 'Battle-Worn '},
                pristinePart: {weight: 4, title: 'Pristine '},

                // Metal
                scrapMetal: {weight: 1, title: 'Scrap Metal'},
                reclaimedMetal: {weight: 3, title: 'Reclaimed Metal'},
                refinedMetal: {weight: 9, title: 'Refined Metal'},

                token: {weight: 1.5, class: 'token'},

                uncraftable: {weight: 0.01, class: 'uncraft'},
                action: {weight: 1, slot: 'action'},
                unique: {weight: 0.5, class: 'quality6'},
                fabricator: {weight: 1, title: 'Fabricator'},
                vintage: {weight: 3, class: 'quality3'},
                genuine: {weight: 3, class: 'quality1'},
                gift: {weight: 9, title: 'Gift'},
                rare: {weight: 9, class: 'rarity'},
                strange: {weight: 18, class: 'quality11'},
                cosmetic: {weight: 18, slot: 'misc'},
                colored: {weight: 18, content: 'div.paintcolor'},
                festive: {weight: 18, content: 'img.festive'},
                killstreak: {weight: 27, class: 'killstreak'},
                taunt: {weight: 45, slot: 'taunt'},
                key: {weight: 180, title: 'Key'},
                ticket: {weight: 180, title: 'Ticket'},
                unusual: {weight: 1000, class: 'quality5'}
            };

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

        function isItemSpecial(data) {
            var weight = 0;
            Object.keys(ITEM_WEIGHT).forEach(function (wt) {
                var type = ITEM_WEIGHT[wt];
                Object.keys(type).forEach(function (key) {
                    if (key !== 'weight') {
                        if (UI.checkAttribute(data, key, type[key])) {
                            weight += type.weight;
                        }
                    }
                });
            });
            return (weight >= WEIGHT_THRESHOLD);
        }

        return {
            isRaffleWorthIt: isRaffleWorthIt,
            isItemSpecial: isItemSpecial,
            goodList: goodRaffleList,
            badList: badRaffleList
        };

    }

    exports.RaffleService = new RaffleService();
})();
