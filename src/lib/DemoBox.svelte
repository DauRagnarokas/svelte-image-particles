<script lang="ts">
  export let title = 'Hello from DemoBox';
</script>

<div style="padding:1rem;border:4px dashed currentColor;border-radius:12px;">
  <strong>{title}</strong>
  <div><slot /></div>
</div>
