import test from "ava";
import { SMAAPass } from "../../build/postprocessing.js";

test("can be created and destroyed", t => {

	const object = new SMAAPass();
	object.dispose();

	t.truthy(object);

});
