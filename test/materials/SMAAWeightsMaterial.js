import test from "ava";
import { SMAAWeightsMaterial } from "../../build/postprocessing.js";

test("can be created", t => {

	t.truthy(new SMAAWeightsMaterial());

});
