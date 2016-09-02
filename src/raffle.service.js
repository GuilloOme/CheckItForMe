(function () {
    'use strict';

    var UI = require('./ui.helper').UIHelper;


    function RaffleService() {
        var TOTAL_ENTRY_THRESHOLD = 300,
            RAFFLE_COUNT_THRESHOLD = 15,
            TIME_LEFT_THRESHOLD = 3600, // in sec: 5400 = 1½hour
            WEIGHT_THRESHOLD = 9,
            ITEM_WEIGHT = [
                //MVM Parts
                {name: 'reinforcedPart', weight: 0.05, type: 'title', value: 'Reinforced '},
                {name: 'battleWornPart', weight: 2, type: 'title', value: 'Battle-Worn '},
                {name: 'pristinePart', weight: 4, type: 'title', value: 'Pristine '},

                // Metal
                {name: 'scrapMetal', weight: 1, type: 'title', value: 'Scrap Metal'},
                {name: 'reclaimedMetal', weight: 3, type: 'title', value: 'Reclaimed Metal'},
                {name: 'refinedMetal', weight: 9, type: 'title', value: 'Refined Metal'},

                {name: 'token', weight: 1.5, type: 'class', value: 'token'},
                {name: 'gift', weight: 9, type: 'title', value: 'Gift'},
                {name: 'fabricator', weight: 1, type: 'title', value: 'Fabricator'},
                {name: 'key', weight: 180, type: 'title', value: 'Key'},
                {name: 'taunt', weight: 45, type: 'slot', value: 'taunt'},
                {name: 'ticket', weight: 180, type: 'title', value: 'Ticket'},
                {name: 'action', weight: 1, type: 'slot', value: 'action'},
                {name: 'cosmetic', weight: 18, type: 'slot', value: 'misc'},

                {name: 'uncraftable', weight: 0.01, type: 'class', value: 'uncraft'},
                // {name: 'unique', weight: 0.5, type: 'class', value: 'quality6 '},
                {name: 'strange', weight: 18, type: 'class', value: 'quality11 '},
                {name: 'unusual', weight: 1000, type: 'class', value: 'quality5 '},

                {name: 'rare', weight: 9, type: 'class', value: 'rarity'},
                {name: 'vintage', weight: 3, type: 'class', value: 'quality3 '},
                {name: 'genuine', weight: 3, type: 'class', value: 'quality1 '},
                {name: 'colored', weight: 18, type: 'content', value: 'div.paintcolor'},
                {name: 'festive', weight: 18, type: 'content', value: 'img.festive'},
                {name: 'killstreak', weight: 27, type: 'class', value: 'killstreak'}
            ];

        var goodRaffleList = [],
            badRaffleList = [];

        function isRaffleWorthIt(data) {
            var raffle = _getRaffleSpecs(data),
                isIt = false;

            if (raffle.itemCount > 0) {
                if (raffle.haveSpecials) {
                    isIt = true;
                } else if (raffle.totalEntries <= TOTAL_ENTRY_THRESHOLD) {
                    isIt = true;
                } else if (raffle.itemCount >= RAFFLE_COUNT_THRESHOLD) {
                    isIt = true;
                } else if (raffle.timeLeft < TIME_LEFT_THRESHOLD) {
                    isIt = true;
                }
            }

            return isIt;
        }

        function _getRaffleSpecs(responseData) {
            var itemsData = $(responseData).find('.raffle-items>div'),
                raffle = {
                    timeLeft: Math.floor((parseInt($(responseData).find('dd.raffle-time-left').attr('data-time')) - (new Date().getTime() / 1000))),
                    winChance: parseFloat($(responseData).find('#raffle-win-chance').html()),
                    totalEntries: parseInt($(responseData).find('span#raffle-num-entries').attr('data-max')),
                    haveSpecials: false, //metal or hats or featured items
                    itemCount: 0,
                    items: []
                };

            for (var i = 0; i <= itemsData.length; i++) {

                var data = $(itemsData[i]);

                //it's a tf2 item
                if (data.attr('data-appid') === '440') {

                    if (_isItemSpecial(data)) {
                        raffle.haveSpecials = true;
                    }

                    raffle.itemCount++;
                }

            }

            return raffle;
        }

        function _getItemWeight(data) {
            var weight = 0;
            ITEM_WEIGHT.forEach(function (wt) {
                if (UI.checkAttribute(data, wt.type, wt.value)) {
                    weight += wt.weight;
                }
            });
            //by default it's a unique
            if (weight === 0) {
                weight = 0.5;
            }
        }

        function _isItemSpecial(data) {
            return (_getItemWeight(data) >= WEIGHT_THRESHOLD);
        }

        return {
            isRaffleWorthIt: isRaffleWorthIt,
            goodList: goodRaffleList,
            badList: badRaffleList
        };

    }

    exports.RaffleService = new RaffleService();
})();
