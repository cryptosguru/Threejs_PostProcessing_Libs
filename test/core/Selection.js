import test from "ava";
import { Selection } from "../../build/postprocessing.js";

test("can be instantiated", t => {

	t.truthy(new Selection());

});
