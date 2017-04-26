(function () {
    'use strict';

    var Storage = require('./storage.service').StorageService;

    function ConfigService() {
        var defaults = {
                delay: {
                    reload: 30, // after a complete load is complete
                    safeReload: 180, // forcing reload after this duration (in case something went wrong)
                    errorReload: 300, // on error delay
                    entering: 3 // between entering
                },
                itemWeight: [
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
                    {name: 'taunt', weight: 30, type: 'slot', value: 'taunt'},
                    {name: 'ticket', weight: 180, type: 'title', value: 'Ticket'},
                    {name: 'action', weight: 1, type: 'slot', value: 'action'},
                    {name: 'cosmetic', weight: 9, type: 'slot', value: 'misc'},

                    {name: 'uncraftable', weight: 0.01, type: 'class', value: 'uncraft'},
                    // {name: 'unique', weight: 0.5, type: 'class', value: 'quality6 '},
                    {name: 'strange', weight: 21, type: 'class', value: 'quality11 '},
                    {name: 'unusual', weight: 1000, type: 'class', value: 'quality5 '},

                    {name: 'rare', weight: 9, type: 'class', value: 'rarity'},
                    {name: 'vintage', weight: 1, type: 'class', value: 'quality3 '},
                    {name: 'genuine', weight: 1, type: 'class', value: 'quality1 '},
                    {name: 'colored', weight: 18, type: 'content', value: 'div.paintcolor'},
                    {name: 'festive on rare', weight: 18, type: 'content', value: 'img.festive'},
                    {name: 'festive', weight: 18, type: 'title', value: 'Festive '},
                    {name: 'killstreak', weight: 27, type: 'class', value: 'killstreak'}
                ],
                threshold: {
                    totalEntry: 200,
                    timeLeft: 2700, // in sec: 5400 = 1½hour
                    averageWeight: 9,
                    absoluteWeight: 21,
                    itemsCount: 40
                },
                blankRun: true // run at blank or not
            },
            config = {},
            isInitialized = false;

        function getConfig() {
            if (!isInitialized) {

                Object.keys(defaults).forEach(function (key) {
                    var configValue = Storage.extract(key);

                    if (typeof configValue === "undefined") {
                        Storage.store(key, defaults[key]);
                        config[key] = defaults[key];
                    } else {
                        config[key] = configValue;
                    }
                });

                isInitialized = true;
            }
            return config;
        }

        return {
            getConfig: getConfig
        };
    }

    exports.ConfigService = new ConfigService();

})();
