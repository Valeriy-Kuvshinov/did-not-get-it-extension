import "./styles/variables.css"
import "./styles/base.css"
import "./styles/helpers.css"
import "./styles/typography.css"

import { mount } from "svelte"

import App from "./App.svelte"

const app = mount(App, {
	target: document.getElementById("app")!,
})

export default app
