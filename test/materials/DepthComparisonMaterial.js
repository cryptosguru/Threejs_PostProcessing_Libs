import test from "ava";
import { DepthComparisonMaterial } from "../../build/postprocessing.esm.js";

test("can be created", t => {

	t.truthy(new DepthComparisonMaterial());

});
