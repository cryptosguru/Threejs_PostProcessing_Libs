import test from "ava";
import { LuminanceMaterial } from "../../build/postprocessing.esm.js";

test("can be created", t => {

	t.truthy(new LuminanceMaterial());

});
