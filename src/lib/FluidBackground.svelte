<script lang="ts">
  import { onMount } from 'svelte';

  let mouseX = 0;
  let mouseY = 0;
  let isMobile = false;

  const handleMouseMove = (event: MouseEvent) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  };

  const handleTouchMove = (event: TouchEvent) => {
    isMobile = true;
    mouseX = event.touches[0].clientX;
    mouseY = event.touches[0].clientY;
  };

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  });
</script>

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
      rgba(229, 9, 20, 0.9) 0%,
      transparent 40%
    );
    mix-blend-mode: screen;
    opacity: 1;
    animation: fluid-move 15s linear infinite;
    border-radius: 40% 60% 60% 40%;
  }

  .fluid-background::after {
    animation: fluid-move-reverse 20s linear infinite;
    border-radius: 60% 40% 40% 60%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(9, 100, 229, 0.9) 0%,
      transparent 40%
    );
  }

  @keyframes fluid-move {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) rotate(180deg) scale(2);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg) scale(1);
    }
  }

  @keyframes fluid-move-reverse {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) scale(2);
    }
    50% {
      transform: translate(-50%, -50%) rotate(-180deg) scale(1);
    }
    100% {
      transform: translate(-50%, -50%) rotate(-360deg) scale(2);
    }
  }
</style>

<div class="fluid-background" />