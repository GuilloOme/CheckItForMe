// ==UserScript==
// @name         CheckItForMe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        SOME-URL
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 60,
        ENTERING_DELAY = 2;

    var todoRaffleList = [],
        raffleIndex = 0;

    $(document).ready(function() {
        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            baseUrl = /SOME-URL[\/]*/;

        if (url.match(baseUrl)) {

            scanRaffles();

            setTimeout(function() {
                location.reload();
            }, RELOAD_DELAY * 1000);
        }

    }

    function scanRaffles() {
        $.when(scrollToBottom()).then(function() {
            $('div.panel-raffle').each(function(id, item) {
                if($(item).css('opacity') === '1'){
                    todoRaffleList.push($(item).find('div.raffle-name > a').attr('href'));
                }
            });
            if(todoRaffleList.length >0){
                enterRaffles(todoRaffleList);
            }
        });
    }

    function enterRaffles(raffleList){
        console.log('enter raffles:',raffleList);

        function joinRaffle(url){
            var currentChildWindow = window.open(url);

            $(currentChildWindow.document).ready(function(){
                var waitInterval;
                console.log('entrering raffle:',url);

                waitInterval= setInterval(function() {
                    console.log('waiting confirmation…');

                    if($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Enter Raffle'){

                        $(currentChildWindow.document).find('button#raffle-enter').trigger( 'click' );

                    }else if($(currentChildWindow.document).find('button#raffle-enter>i18n').html() === 'Leave Raffle' || $(currentChildWindow.document).find('div.alert-error').css('display') !== 'none'){

                        console.log('closing window');

                        currentChildWindow.close();

                        raffleIndex++;
                        if(raffleIndex < todoRaffleList.length){
                            setTimeout(function() {
                                joinRaffle(todoRaffleList[raffleIndex]);
                            }, ENTERING_DELAY*1000);
                        }

                        clearInterval(waitInterval);

                    }
                },1000);



            });


        }

        joinRaffle(todoRaffleList[raffleIndex]);
    }



    function scrollToBottom() {
        var deferred = jQuery.Deferred(),
            keepScrolling = true;

        var scrollInterval = setInterval(function() {

            if (keepScrolling) {
                $('html, body').animate({scrollTop: $(document).height()}, 50);
            } else {
                deferred.resolve();
                clearInterval(scrollInterval);
            }

            keepScrolling = !($('.pag-loading').text() === 'That\'s all, no more!');

        }, 100);

        return deferred.promise();

    }
})();
