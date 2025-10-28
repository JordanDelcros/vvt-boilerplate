import Packer from "./framework/assets-packer";

Packer.root = "/assets";
Packer.destination = "/public/.generated";

Packer.useVerbose(false);
Packer.useFast(true);
// Packer.forceUpdate();

// Locales
Packer.add("locales/*.json", Packer.usages.locale, { destination: "/public/locales" });

// Commons
Packer.add("models/**/*.glb", Packer.usages.model, { force: false, optimize: false });
Packer.add("maps/**/*.exr", Packer.usages.copy, { force: true });
Packer.add("maps/**/*.png", Packer.usages.texture);

// Sounds
Packer.add("audio/sounds/*", Packer.usages.sound, { name: "packed-sounds" });

// Musics
Packer.add("audio/musics/*.mp3", Packer.usages.audio);

// Fonts
Packer.add("fonts/**/*.ttf", Packer.usages.font);

export default Packer;
