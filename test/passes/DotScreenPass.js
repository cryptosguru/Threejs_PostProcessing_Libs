import test from "ava";
import { DotScreenPass } from "../../build/postprocessing.js";

test("can be created and destroyed", t => {

	const object = new DotScreenPass();
	object.dispose();

	t.truthy(object);

});
