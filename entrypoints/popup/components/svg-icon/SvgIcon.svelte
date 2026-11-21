<script lang="ts">
	import { ICON_MAP, type IconName } from "./icon.map"

	export let icon: IconName
	export let className: string = ""

	$: svgWithProps = ICON_MAP[icon]
		? ICON_MAP[icon].replace("<svg", `<svg class="${className}" aria-hidden="true"`)
		: ""
</script>

{@html svgWithProps}
