import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
// Use the locally installed Edge instead of downloading a headless Chrome.
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
