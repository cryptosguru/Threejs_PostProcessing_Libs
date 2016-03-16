/**
 * Exposure of the library components.
 *
 * @module postprocessing
 */

export { EffectComposer } from "./effect-composer";

export {
	ToneMappingPass,
	BloomPass,
	BokehPass,
	ClearMaskPass,
	DotScreenPass,
	FilmPass,
	GlitchPass,
	GodRaysPass,
	MaskPass,
	Pass,
	RenderPass,
	SavePass,
	SMAAPass,
	ShaderPass
} from "./passes";

export {
	AdaptiveLuminosityMaterial,
	BokehMaterial,
	CombineMaterial,
	ConvolutionMaterial,
	CopyMaterial,
	DotScreenMaterial,
	FilmMaterial,
	GlitchMaterial,
	GodRaysMaterial,
	LuminosityMaterial,
	SMAABlendMaterial,
	SMAAColorEdgesMaterial,
	SMAAWeightsMaterial,
	ToneMappingMaterial
} from "./materials";
