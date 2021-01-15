import test from "ava";
import { ShaderPass } from "../../";

test("can be created and destroyed", t => {

	const object = new ShaderPass(null);
	object.dispose();

	t.pass();

});
