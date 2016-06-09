// ==UserScript==
// @name         CheckItForMe
// @version      0.12
// @match        https://scrap.tf/raffles
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @updateURL    https://raw.githubusercontent.com/GuilloOme/CheckThisForMe/master/checkItForMe.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 30,
        ENTERING_DELAY = 2;

    var todoRaffleList = [],
        raffleIndex = 0,
        interval = randomInterval(RELOAD_DELAY);

    $(document).ready(function() {
        console.log('Bot: Started');
        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            baseUrl = /https:\/\/scrap.tf\/raffles/;

        if (url.match(baseUrl) && isThereNewRaffles()) {
            scanRaffles();
        } else {
            console.log('Bot: Nothing to do, waiting ' + (interval / 1000) + ' sec before reloading…');

            setTimeout(function() {
                location.reload();
            }, interval);
        }

    }

    function scanRaffles() {
        console.log('Bot: Loading all the raffles…');

        $.when(loadAllRaffles()).then(function() {
            var activePanel = $('div.panel');
            $(activePanel[activePanel.length-1]).find('div.panel-raffle').each(function(id, item) {
                if ($(item).css('opacity') === '1') {
                    todoRaffleList.push($(item).find('div.raffle-name > a').attr('href'));
                }
            });

            if (todoRaffleList.length > 0) {
                console.log('Bot: Start entering raffles.');

                $.when(enterRaffles()).then(function() {
                    console.log('Bot: Done entering raffles, reloading…');
                    location.reload();
                });
            } else {
                console.log('Bot: No raffle to enter, waiting ' + (interval / 1000) + ' sec before reloading…');
                setTimeout(function() {
                    location.reload();
                }, interval);
            }
        });

    }

    function enterRaffles() {
        var deferred = jQuery.Deferred();

        function joinRaffle(url) {
/*
            var id, hash;

            ScrapTF.Raffles.EnterRaffle = function(idArg, hashArg) {
                id = idArg;
                hash = hashArg;
            }

            $.get(url, function(responseData) {

                $(data).find('button#raffle-enter').click();

                // DEBUG:
                console.log('id', id, 'hash', hash);
            });
*/
            var currentChildFrame = window.open(url);

            $(currentChildFrame.document).ready(function() {
                var waitInterval;
                console.log('Bot: Entrering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                waitInterval = setInterval(function() {
                    console.log('Bot: Waiting confirmation…');

                    if ($(currentChildFrame.document).find('button#raffle-enter>i18n').html() === 'Leave Raffle' || $(currentChildFrame.document).find('div.alert-error').length > 0) {

                        console.log('Bot: Closing raffle window');

                        currentChildFrame.close();

                        raffleIndex++;
                        if (raffleIndex < todoRaffleList.length) {
                            setTimeout(function() {
                                joinRaffle(todoRaffleList[raffleIndex]);
                            }, randomInterval(ENTERING_DELAY));
                        } else {
                            deferred.resolve();
                        }

                        clearInterval(waitInterval);

                    } else if ($(currentChildFrame.document).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {

                        $(currentChildFrame.document).find('button#raffle-enter').trigger('click');

                    }
                }, randomInterval(ENTERING_DELAY));

            });

        }

        joinRaffle(todoRaffleList[raffleIndex]);

        return deferred.promise();
    }

    function isThereNewRaffles() {

        var value = $('div.panel-body>div.text-center>i18n>var').text(),
            ar = value.match(/[0-9]+/gi),
            raffleToEnterNumber = (parseInt(ar[1]) - parseInt(ar[0]));

        console.log('Bot: Current state: ' + value);
        console.log('Bot: There is ' + raffleToEnterNumber + ' raffle(s) to enter.');

        return (ar.length > 1 && raffleToEnterNumber > 0);
    }

    function loadAllRaffles() {
        var deferred = jQuery.Deferred();

        var loadInterval = setInterval(function() {

            if (!ScrapTF.Raffles.Pagination.isDone) {
                ScrapTF.Raffles.Pagination.LoadNext();
            } else {
                deferred.resolve();
                clearInterval(loadInterval);
            }

        }, randomInterval());

        return deferred.promise();

    }

    function randomInterval(delay) {
        if (!delay) {
            delay = 0.5;
        }
        return Math.floor(delay * 1000) + Math.floor(Math.random() * (delay * 1000));
    }

})
();
