import Packer from "./framework/tools/assets-packer";

// Packer.forceUpdate();
// Packer.forceFast();

// Commons
Packer.add("maps/**/*.png", Packer.usages.texture);

// Levels
Packer.add("levels/**/*.png", Packer.usages.texture);

// Sounds
Packer.add("audio/sounds/*", Packer.usages.sound, { name: "packed-sounds" });

// Musics
Packer.add("audio/musics/*.mp3", Packer.usages.audio);

export default Packer;
