(function () {
    'use strict';

    var RafflesService = require('./raffles.service').RafflesService,
        Interval = require('./interval.helper').IntervalHelper,
        UI = require('./ui.helper').UIHelper;

    var RELOAD_DELAY = 50;

    var interval = Interval.randomInterval(RELOAD_DELAY);


    $(document).ready(function () {

        UI.createBotPanel();

        UI.showMessage('Started');


        if (UI.getUserNoticeCount() > 0) {
            UI.showMessage('There is new message(s)!');
            UI.showIcon('Ok');
        }


        UI.showMessage('Loading all the raffles…');

        $.when(loadAllRafflesInPage()).then(function () {
            var activePanel = $('div.panel');
            $(activePanel[activePanel.length - 1]).find('div.panel-raffle').each(function (id, item) {
                var url = $(item).find('div.raffle-name > a').attr('href');

                if ($(item).css('opacity') === '1' && RafflesService.badList.indexOf(url) < 0) {
                    RafflesService.goodList.push(url);
                }
            });

            if (RafflesService.goodList.length > 0) {
                //Start entering raffles

                UI.addProgress('', 0, 'success');

                $.when(RafflesService.enterRaffles()).then(function () {
                    //Done entering raffles, reloading…
                    location.reload();
                });
            } else {

                var interval = Interval.randomInterval(RELOAD_DELAY),
                    timer = 1000;

                UI.showMessage('No new raffle to enter, waiting…');

                UI.addProgress('', 0);

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

    function loadAllRafflesInPage() {
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

})();

