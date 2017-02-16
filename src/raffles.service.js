(function () {
    'use strict';

    var Raffle = require('./raffle').Raffle,
        Storage = require('./storage.service').StorageService,
        Config = require('./config.service').ConfigService,
        Interval = require('./interval.helper').IntervalHelper,
        UI = require('./ui.helper').UIHelper;

    function RafflesService() {

        var goodRaffleList = [],
            badRaffleList = Storage.extract('badRaffleList') || [],
            raffleIndex = 0,
            config = Config.getConfig();


        function enterRaffles() {
            var enterDeferred = jQuery.Deferred();

            _joinRaffle(goodRaffleList[0], enterDeferred);

            return enterDeferred.promise();
        }

        function _joinRaffle(url, enterDeferred) {

            var raffleId, raffleHash;

            ScrapTF.Raffles.EnterRaffle = function (idArg, hashArg) {
                raffleId = idArg;
                raffleHash = hashArg;
            };

            UI.showMessage('Checking raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length);

            $.get(url, function (responseData) {

                var request,
                    raffleDeferred = jQuery.Deferred(),
                    raffleKey = $(responseData).find("#raffle-key").val(),
                    enterButton = $(responseData).find('button#raffle-enter');

                if (_isRaffleWorthIt(url, responseData)) {
                    if (enterButton.length > 0 && $(responseData).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {
                        UI.showMessage('Entering raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length);

                        if (!config.blankRun) {
                            $(responseData).find('button#raffle-enter').click();

                            request = {
                                raffle: raffleId,
                                captcha: '',
                                rafflekey: raffleKey,
                                password: '',
                                hash: raffleHash
                            };

                            ScrapTF.Ajax('viewraffle/EnterRaffle', request, function () {
                                raffleDeferred.resolve('Done entering raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length, true);
                            }, function (data) {

                                if (data.captcha) {
                                    showIcon('Warning');

                                    setTimeout(function () {
                                        location.reload();
                                    }, config.delay.errorReload * 1000);

                                    raffleDeferred.reject('Captcha requested! Reloading in ' + config.delay.errorReload / 60 + 'minutes…');
                                } else {
                                    raffleDeferred.resolve('Error when entering raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length + ' - ' + data.message);
                                }
                            });

                        } else {
                            raffleDeferred.resolve('Blank run, did NOT enter raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length);
                        }

                    } else {
                        raffleDeferred.resolve('Can\'t enter raffle: ' + (raffleIndex + 1) + '/' + goodRaffleList.length + ' (no button to click)');
                    }
                } else {
                    badRaffleList.push(url);
                    _saveBadRaffleList(badRaffleList);
                    raffleDeferred.resolve('Raffle not worth it: ' + (raffleIndex + 1) + '/' + goodRaffleList.length);
                }

                $.when(raffleDeferred.promise()).then(function (message, haveToWait) {
                    var interval = Interval.randomInterval();

                    UI.showMessage(message);

                    UI.updateProgress((raffleIndex + 1) / goodRaffleList.length, (raffleIndex + 1) + '/' + goodRaffleList.length);

                    if (haveToWait) {
                        interval = Interval.randomInterval(config.delay.entering);
                    }

                    raffleIndex++;
                    if (raffleIndex < goodRaffleList.length) {
                        setTimeout(function () {
                            _joinRaffle(goodRaffleList[raffleIndex], enterDeferred);
                        }, interval);
                    } else {
                        enterDeferred.resolve();
                    }
                });

            });

        }

        function _isRaffleWorthIt(url, data) {
            var raffle = Raffle.build(url, data);
            return raffle.isWorthIt;
        }


        function _saveBadRaffleList() {
            Storage.store('badRaffleList', badRaffleList);
        }

        return {
            enterRaffles: enterRaffles,
            goodList: goodRaffleList,
            badList: badRaffleList
        };

    }

    exports.RafflesService = new RafflesService();
})();
