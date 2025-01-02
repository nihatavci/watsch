<style global>
  .fluid-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    overflow: hidden;
    background: #000;
  }

  .fluid-background::before,
  .fluid-background::after {
    content: '';
    position: absolute;
    width: 200vmax;
    height: 200vmax;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(229, 9, 20, 0.8) 0%,
      transparent 50%
    );
    mix-blend-mode: screen;
    opacity: 1;
    animation: fluid-move 30s linear infinite;
    border-radius: 40% 60% 60% 40%;
  }

  .fluid-background::after {
    animation: fluid-move-reverse 40s linear infinite;
    border-radius: 60% 40% 40% 60%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(9, 100, 229, 0.8) 0%,
      transparent 50%
    );
  }

  @keyframes fluid-move {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) rotate(180deg) scale(1.5);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg) scale(1);
    }
  }

  @keyframes fluid-move-reverse {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(1.5);
    }
    50% {
      transform: translate(-50%, -50%) rotate(-180deg) scale(1);
    }
    100% {
      transform: translate(-50%, -50%) rotate(-360deg) scale(1.5);
    }
  }
</style>

<div class="fluid-background" /> 