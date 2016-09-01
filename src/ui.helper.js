(function () {
    'use strict';
    function UIHelper() {

        var botPanel,
            progress;


        function createBotPanel() {
            var panel = $('<div class="panel panel-info"><div class="panel-body">Bot: <span class="botMessage"></span></div></div>');

            $('body>div.container').prepend(panel);

            botPanel = panel;
        }

        function showMessage(message) {

            botPanel.find('span.botMessage').text(message);

            console.info(message);
        }

        function showIcon(iconType) {
            var iconLink = '';

            if (iconType === 'Ok') {
                iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYXBtEGTQbRBk8G0QZPBtEGTwbRBk8G0QZPBtEGTwbRBkkG0QYKAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYQBtEG5wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEGwAXRBQAAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/J9cn/z/bP/6bvpv9/53//nO2c/53tnf/u/O7/l+yX/wbRBvkF0QUHAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb/yjXKP8G0Qb/EdMR/0zeTP9C3EL/6vvq/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42/8l1yX/BtEG/xHTEf9M3kz/Nto2/7Xxtf+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOgbRBv/b+Nv/jeqN/xjUGP8S0xL/TN5M/zfaN//F9MX/pO6k/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb//////+B6IH/FNQU/8X0xf+9873/9v32/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42///////6vvq/w/TD//z/fP///////////+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/T99P/+f75//n++f+b7Zv/9f31//n++f/5/vn/nu2e/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBhMG0QbtB9EH/wjRCP8I0Qj/CNEI/wjRCP8I0Qj/CNEI/wfRB/8G0QbHBdEFAQAAAAAAAAAAAAAAAAAAAAAAAAAABtEGHwbRBlsG0QZdBtEGXQbRBl0G0QZdBtEGXQbRBl0G0QZWBtEGDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA4AcAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAOAHAAD//wAA//8AAA==" rel="icon" type="image/x-icon">';
            } else if (iconType === 'Warning') {
                iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==" rel="icon" type="image/x-icon">';
            }

            $('link[rel*="icon"]').remove();
            $('head').append(iconLink);

        }

        function addProgress(text, percent, type) {

            if (!type) {
                type = 'info';
            }

            progress = $('<div class="progress"><div class="progress-bar progress-bar-' + type + '" role="progressbar" aria-valuenow="' + percent * 100 + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percent * 100 + '%;">' + text + '</div></div>');

            botPanel.find('.botMessage').after(progress);

        }

        function updateProgress(percent, text) {
            progress.find('div.progress-bar').attr('aria-valuenow', percent * 100);
            progress.find('div.progress-bar').css('width', percent * 100 + '%');

            if (text) {
                progress.find('div.progress-bar').text(text);
            }
        }

        function getUserNoticeCount() {
            return parseInt($('.user-notices-count').html());
        }

        return {
            createBotPanel: createBotPanel,
            showMessage: showMessage,
            showIcon: showIcon,
            addProgress: addProgress,
            updateProgress: updateProgress,
            getUserNoticeCount: getUserNoticeCount
        };
    }

    exports.UIHelper = new UIHelper();
})();
