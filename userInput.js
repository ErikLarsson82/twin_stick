define('userInput', [], function() {

    window.addEventListener("gamepadconnected", function(e) {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id,
        e.gamepad.buttons.length, e.gamepad.axes.length);
    });

    return {
        readInput: function() {
            return navigator.getGamepads();
        }
    }
});