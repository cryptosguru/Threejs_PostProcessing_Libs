import test from "ava";
import { AdaptiveLuminanceMaterial } from "../../";

test("can be created", t => {

	t.truthy(new AdaptiveLuminanceMaterial());

});
