import type { NavigationTree } from "@/@types/navigation";
import {
  NAV_ITEM_TYPE_ITEM,
  NAV_ITEM_TYPE_TITLE,
} from "@/constants/navigation.constant";
import { ADMIN, USER } from "@/constants/roles.constant";

const authorAnalyzerNavigationConfig: NavigationTree[] = [
  {
    key: "authorAnalyzer",
    path: "",
    title: "Author Analyzer",
    translateKey: "nav.authorAnalyzer.title",
    icon: "dashboard",
    type: NAV_ITEM_TYPE_TITLE,
    authority: [ADMIN, USER],
    subMenu: [
      {
        key: "authorAnalyzer.dashboard",
        path: "/dashboard",
        title: "Dashboard",
        translateKey: "nav.authorAnalyzer.dashboard",
        icon: "dashboard",
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        subMenu: [],
      },
      {
        key: "authorAnalyzer.reports",
        path: "/reports",
        title: "Reports",
        translateKey: "nav.authorAnalyzer.reports",
        icon: "fileManager",
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        subMenu: [],
      },
      {
        key: "authorAnalyzer.leads",
        path: "/leads",
        title: "Leads",
        translateKey: "nav.authorAnalyzer.leads",
        icon: "customers",
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        subMenu: [],
      },
      {
        key: "authorAnalyzer.analyze",
        path: "/",
        title: "Analyze Website",
        translateKey: "nav.authorAnalyzer.analyze",
        icon: "uiGraphChart",
        type: NAV_ITEM_TYPE_ITEM,
        authority: [ADMIN, USER],
        subMenu: [],
      },
    ],
  },
];

export default authorAnalyzerNavigationConfig;
