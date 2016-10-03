requirejs.config({
    waitSeconds: '60',
    paths: {
        Box2D: 'Box2D',
        json: 'json',
        text: 'text'
    }
});

requirejs([
  'game'
], function (game) {

    let running = false;

    window.addEventListener('keydown', function (e) {
        switch(e.keyCode) {
            case 80:
                running = !running;
            break;
            case 84:
                running = false;
                game.tick();
            break;
            default:
                console.log(e.keyCode);
            break;
        }
    });

    game.init();

    function gameLoop() {
        window.requestAnimationFrame(gameLoop);
        if (!running) return;
        game.tick();
    }
    gameLoop();
})