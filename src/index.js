(function () {
    'use strict';

    var Raffle = require('./raffle.service').RaffleService,
        Interval = require('./interval.helper').IntervalHelper,
        UI = require('./ui.helper').UIHelper;

    var RELOAD_DELAY = 50,
        ERROR_RELOAD_DELAY = 300,
        ENTERING_DELAY = 3;

    var todoRaffleList = Raffle.goodList,
        badRaffleList = Raffle.badList,
        raffleIndex = 0,
        interval = Interval.randomInterval(RELOAD_DELAY),
        haveStorageSupport = false;


    $(document).ready(function () {

        UI.createBotPanel();

        UI.showMessage('Started');

        if (typeof(Storage) !== "undefined") {
            haveStorageSupport = true;

            // initiate the locals
            if (typeof localStorage.badRaffleList !== 'string') {
                saveBadRaffleList([]);
            }

            if (JSON.parse(localStorage.badRaffleList).length > 1000) {
                console.warn('Purging bad raffle cache!');
                saveBadRaffleList([]);
            } else {
                badRaffleList = badRaffleList.concat(JSON.parse(localStorage.badRaffleList));
            }
        }

        if (UI.getUserNoticeCount() > 0) {
            UI.showMessage('There is new message(s)!');
            UI.showIcon('Ok');
        }


        UI.showMessage('Loading all the raffles…');

        $.when(loadAllRaffles()).then(function () {
            var activePanel = $('div.panel');
            $(activePanel[activePanel.length - 1]).find('div.panel-raffle').each(function (id, item) {
                var url = $(item).find('div.raffle-name > a').attr('href');

                // DEBUG: check everything
                // if ($(item).css('opacity') === '1' && badRaffleList.indexOf(url) < 0) {
                    todoRaffleList.push(url);
                // }
            });

            if (todoRaffleList.length > 0) {
                //UI.showMessage('Start entering raffles.');

                $.when(enterRaffles()).then(function () {
                    //UI.showMessage('Done entering raffles, reloading…');
                    // DEBUG:
                    console.log('no reload');
                    //location.reload();
                });
            } else {
                UI.showMessage('No new raffle to enter, waiting…');

                UI.addProgress('', 0);
                var timer = 1000;
                setInterval(function () {
                    UI.updateProgress(timer / interval);
                    timer += 250;
                }, 250);

                setTimeout(function () {
                    location.reload();
                }, interval);
            }
        });

    });

    function enterRaffles() {
        var deferred = jQuery.Deferred();

        UI.addProgress('', 0, 'success');

        function joinRaffle(url) {

            var id, hash;

            ScrapTF.Raffles.EnterRaffle = function (idArg, hashArg) {
                id = idArg;
                hash = hashArg;
            };

            UI.showMessage('Checking raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

            $.get(url, function (responseData) {

                var request,
                    raffleDeferred = jQuery.Deferred(),
                    raffleKey = $(responseData).find("#raffle-key").val(),
                    enterButton = $(responseData).find('button#raffle-enter');

                if (Raffle.isRaffleWorthIt(responseData)) {
                    // DEBUG: Do not enter!!
                    if (enterButton.length > 0 && $(responseData).find('button#raffle-enter>i18n').html() === 'Enter Raffle' && false) {
                        UI.showMessage('Entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                        $(responseData).find('button#raffle-enter').click();

                        request = {
                            raffle: id,
                            captcha: '',
                            rafflekey: raffleKey,
                            password: '',
                            hash: hash
                        };

                        ScrapTF.Ajax('viewraffle/EnterRaffle', request, function () {
                            raffleDeferred.resolve('Done entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length, true);
                        }, function (data) {

                            if (data.captcha) {
                                showIcon('Warning');

                                setTimeout(function () {
                                    location.reload();
                                }, ERROR_RELOAD_DELAY * 1000);

                                raffleDeferred.reject('Captcha requested! Reloading in ' + ERROR_RELOAD_DELAY / 60 + 'minutes…');
                            } else {
                                raffleDeferred.resolve('Error when entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length + ' - ' + data.message);
                            }
                        });

                    } else {
                        raffleDeferred.resolve('Can\'t enter raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length + ' (no button to click)');
                    }
                } else {
                    badRaffleList.push(url);
                    saveBadRaffleList(badRaffleList);
                    raffleDeferred.resolve('Raffle not worth it: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
                }

                $.when(raffleDeferred.promise()).then(function (message, haveToWait) {
                    var interval = Interval.randomInterval();

                    UI.showMessage(message);

                    UI.updateProgress((raffleIndex + 1) / todoRaffleList.length, (raffleIndex + 1) + '/' + todoRaffleList.length);

                    if (haveToWait) {
                        interval = Interval.randomInterval(ENTERING_DELAY);
                    }

                    raffleIndex++;
                    if (raffleIndex < todoRaffleList.length) {
                        setTimeout(function () {
                            joinRaffle(todoRaffleList[raffleIndex]);
                        }, interval);
                    } else {
                        deferred.resolve();
                    }
                });

            });

        }

        joinRaffle(todoRaffleList[raffleIndex]);

        return deferred.promise();
    }

    function loadAllRaffles() {
        var deferred = jQuery.Deferred();

        var loadInterval = setInterval(function () {

            if (!ScrapTF.Raffles.Pagination.isDone) {
                ScrapTF.Raffles.Pagination.LoadNext();
            } else {
                deferred.resolve();
                clearInterval(loadInterval);
            }

        }, Interval.randomInterval());

        return deferred.promise();

    }

    function saveBadRaffleList(list) {
        if (haveStorageSupport) {
            localStorage.badRaffleList = JSON.stringify(list);
        }
    }

})();

