(function () {
    'use strict';
    var UI = require('./ui.helper').UIHelper,
        Config = require('./config.service').ConfigService;

    var config = Config.getConfig();

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

                        if (this.averageItemWeight >= config.threshold.averageWeight || this.itemMaxWeight >= config.threshold.absoluteWeight) {
                            isIt = true;
                        } else if (this.totalEntries <= config.threshold.totalEntry) {
                            isIt = true;
                        } else if (this.itemsCount >= config.threshold.itemsCount) {
                            isIt = true;
                        } else if (this.timeLeft < config.threshold.timeLeft && !(this.winChance < 1)) {
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
            config.itemWeight.forEach(function (wt) {
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
