import { ConfigPlugin } from "expo/config-plugins";
import withOpenWearablesIOS, {
  OpenWearablesIOSPluginProps,
} from "./withOpenWearablesIOS";
import withOpenWearablesAndroid from "./withOpenWearablesAndroid";

export type OpenWearablesPluginProps = OpenWearablesIOSPluginProps;

const withOpenWearables: ConfigPlugin<OpenWearablesPluginProps> = (
  config,
  options = {}
) => {
  config = withOpenWearablesIOS(config, options);
  config = withOpenWearablesAndroid(config);
  return config;
};

export default withOpenWearables;
