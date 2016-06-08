// ==UserScript==
// @name         CheckItForMe
// @namespace    http://tampermonkey.net/
// @version      0.2
// @match        https://scrap.tf/raffles
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 30,
        ENTERING_DELAY = 2;

    var todoRaffleList = [],
        raffleIndex = 0;

    $(document).ready(function() {

        // DEBUG:
        console.log('dbg', ScrapTF.Raffles.Pagination.isDone);
        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            baseUrl = /https:\/\/scrap.tf\/raffles/;

        if (url.match(baseUrl) && isThereNewRaffles()) {
            scanRaffles();
        } else {
            setTimeout(function() {
                location.reload();
            }, randomInterval(RELOAD_DELAY));
        }

    }

    function scanRaffles() {

        $.when(scrollToBottom()).then(function() {
            $('div.panel-raffle').each(function(id, item) {
                if ($(item).css('opacity') === '1') {
                    todoRaffleList.push($(item).find('div.raffle-name > a').attr('href'));
                }
            });

            if (todoRaffleList.length > 0) {
                $.when(enterRaffles()).then(function() {
                    setTimeout(function() {
                        location.reload();
                    }, randomInterval(RELOAD_DELAY));
                });
            } else {
                setTimeout(function() {
                    location.reload();
                }, randomInterval(RELOAD_DELAY));
            }
        });
    }

    function enterRaffles() {
        var deferred = jQuery.Deferred();

        console.log('entering raffles:', todoRaffleList.length);

        function joinRaffle(url) {
            var currentChildWindow = window.open(url);

            $(currentChildWindow.document).ready(function() {
                var waitInterval;
                console.log('entrering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                waitInterval = setInterval(function() {
                    console.log('waiting confirmation…');

                    if ($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Leave Raffle' || $(currentChildWindow.document).find('div.alert-error').length > 0) {

                        console.log('closing window');

                        currentChildWindow.close();

                        raffleIndex++;
                        if (raffleIndex < todoRaffleList.length) {
                            setTimeout(function() {
                                joinRaffle(todoRaffleList[raffleIndex]);
                            }, randomInterval(ENTERING_DELAY));
                        } else {
                            deferred.resolve();
                        }

                        clearInterval(waitInterval);

                    } else if ($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {

                        $(currentChildWindow.document).find('button#raffle-enter').trigger('click');

                    }
                }, randomInterval(ENTERING_DELAY));

            });

        }

        joinRaffle(todoRaffleList[raffleIndex]);

        return deferred.promise();
    }

    function isThereNewRaffles() {

        var value = $('div.panel-body>div.text-center>i18n>var').text(),
            ar = value.match(/[0-9]+/gi);
        return (ar.length > 1 && ar[0] < ar[1]);
    }

    function scrollToBottom() {
        var deferred = jQuery.Deferred(),
            keepScrolling = true;

        var scrollInterval = setInterval(function() {

            if (keepScrolling) {
                $('html, body').animate({scrollTop: $(document).height()}, 500);
            } else {
                deferred.resolve();
                clearInterval(scrollInterval);
            }

            keepScrolling = !($('.pag-loading').text() === 'That\'s all, no more!');

        }, randomInterval());

        return deferred.promise();

    }

    function randomInterval(delay) {
        if (!delay) {
            delay = 1;
        }
        return (delay * 1000) + Math.floor(Math.random() * (delay * 1000));
    }

})();