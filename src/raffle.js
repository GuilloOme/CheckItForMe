(function () {
    'use strict';
    var UI = require('./ui.helper').UIHelper;

    var ITEM_WEIGHT = [
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
        {name: 'festive on rare', weight: 18, type: 'content', value: 'img.festive'},
        {name: 'festive', weight: 18, type: 'title', value: 'Festive '},
        {name: 'killstreak', weight: 27, type: 'class', value: 'killstreak'}
    ];

    var TOTAL_ENTRY_THRESHOLD = 300,
        RAFFLE_COUNT_THRESHOLD = 15,
        TIME_LEFT_THRESHOLD = 3600, // in sec: 5400 = 1½hour
        AVERAGE_WEIGHT_THRESHOLD = 1.5,
        WEIGHT_THRESHOLD = 18;


    function RaffleObject() {


        function Raffle(params) {

            this.id = params.id;
            this.url = params.url;
            this.timeLeft = params.timeLeft;
            this.winChance = params.winChance;
            this.totalEntries = params.totalEntries;
            this.winType = params.winType;
            this.items = params.items;
        }

        Raffle.build = function (url, responseData) {

            var itemsData = $(responseData).find('.raffle-items>div'),
                params = {
                    id: url.substr(url.lastIndexOf('/') + 1),
                    url: url,
                    timeLeft: Math.floor((parseInt($(responseData).find('dd.raffle-time-left').attr('data-time')) - (new Date().getTime() / 1000))),
                    winChance: parseFloat($(responseData).find('#raffle-win-chance').html()),
                    totalEntries: parseInt($(responseData).find('span#raffle-num-entries').attr('data-max')),
                    winType: $(responseData).find('dd.type>i18n').html(),
                    items: []
                };

            for (var i = 0; i <= itemsData.length; i++) {
                var data = $(itemsData[i]);

                //it's a tf2 item
                if (data.attr('data-appid') === '440') {
                    params.items.push(_getItemWeight(data));
                }
            }

            return new Raffle(params);
        };


        Object.defineProperties(Raffle.prototype, {
            itemsCount: {
                get: function () {
                    return this.items.length;
                }
            },
            averageItemWeight: {
                get: function () {
                    var total = 0;
                    this.items.forEach(function (w) {
                        total += w;
                    });

                    return total / this.itemsCount;
                }
            },
            isWorthIt: {
                get: function () {
                    var isIt = false;

                    if (this.itemsCount > 0) {

                        if (this.averageItemWeight >= AVERAGE_WEIGHT_THRESHOLD || this.itemMaxWeight >= WEIGHT_THRESHOLD) {
                            isIt = true;
                        } else if (this.totalEntries <= TOTAL_ENTRY_THRESHOLD) {
                            isIt = true;
                        } else if (this.itemsCount >= RAFFLE_COUNT_THRESHOLD) {
                            isIt = true;
                        } else if (this.timeLeft < TIME_LEFT_THRESHOLD && !(this.winChance < 1)) {
                            isIt = true;
                        }
                    }
                    return isIt;
                }
            },
            itemMaxWeight: {
                get: function () {
                    var weight = 0;
                    this.items.forEach(function (i) {
                        if (i > weight) {
                            weight = i;
                        }
                    });
                    return weight;
                }
            }

        });

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
            return weight;
        }

        return Raffle;
    }

    exports.Raffle = RaffleObject();

})();
