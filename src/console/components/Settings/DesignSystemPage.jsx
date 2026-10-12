import { deriveAttribution } from '../../data/sourceAttribution';
import { TaskDisclosure } from '../Conversation/FutureTaskBlock';
import { TaskCodeBlock } from '../Conversation/TaskCodeBlock';
import { QUERY_SQL } from '../../data/cardTaskScenario';
import { useFutureTasks } from '../../variants/useFutureTasks';
import { useState } from 'react';
import { ComposerExample } from './ComposerExample';
import { SkillMenu } from '../Conversation/SkillPicker';
import { DESIGN_SYSTEM_COMMANDS } from './designSystemCommands';
import { RotatingTipExample } from './RotatingTipExample';
import { ChatStatus } from '../Sidebar/ChatStatus';
import { NavRow } from '../NavRow';
import { SegmentSwitch } from '../SegmentSwitch';
import { MessageIndicator } from '../Conversation/MessageIndicator';
import { ArtifactChips, SourceItemRow } from '../Conversation/ArtifactChips';
import { Elicitation, RiskElicitation } from '../Conversation/Elicitation';
import { AskQuestion } from '../Conversation/AskQuestion';
import {
  PlusIcon,
  SearchIcon,
  CloseIcon,
  MenuDotsIcon,
  CanvasHeaderCreatedIcon,
  ClockIcon,
  SourceIcon,
  EyeOpenIcon,
  TaskExpandIcon,
  TaskSubtitleArrow,
  CopyIcon,
  ExpandArrowIcon,
  ArtifactChartIcon,
  ArtifactTableIcon,
  ArtifactTextIcon,
  ArtifactCodeIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from '../icons';
import {
  CanvasTabIconBarChart,
  CanvasTabIconList,
  CanvasTabIconNote,
  CanvasTabIconCode,
} from '../Canvas/tab-icons/CanvasTabIcons';
import { Chart } from '../Canvas/Chart';
import { BarChart } from '../Canvas/BarChart';
import { TaskSequenceExample } from './TaskSequenceExample';
import { ThinkingIndicator } from '../Conversation/ThinkingIndicator';

// ─── Settings sidebar icons (duplicated here for reference display) ───────────
function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.38128 1.38128C6.72299 1.03957 7.27701 1.03957 7.61872 1.38128C7.96043 1.72299 7.96043 2.27701 7.61872 2.61872L3.11244 7.125H15C15.4833 7.125 15.875 7.51675 15.875 8C15.875 8.48325 15.4833 8.875 15 8.875H3.11244L7.61872 13.3813C7.96043 13.723 7.96043 14.277 7.61872 14.6187C7.27701 14.9604 6.72299 14.9604 6.38128 14.6187L0.381282 8.61872C0.210427 8.44786 0.125 8.22393 0.125 8C0.125 7.77607 0.210427 7.55214 0.381282 7.38128L6.38128 1.38128Z" fill="currentColor"/>
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M8.00097 1.4C6.60941 1.4 5.69277 1.67532 4.9458 1.95543C4.58382 2.09117 4.18033 1.90777 4.04458 1.54579C3.90884 1.1838 4.09224 0.780314 4.45423 0.64457C5.30726 0.324683 6.39445 0 8.00097 0C9.60764 0 10.693 0.324751 11.5458 0.64457C11.9078 0.780314 12.0912 1.1838 11.9554 1.54579C11.8197 1.90777 11.4162 2.09117 11.0542 1.95543C10.3071 1.67525 9.39239 1.4 8.00097 1.4ZM13.2663 6.09515C10.3418 3.17281 5.24772 3.29001 2.73377 6.25288C2.48365 6.54767 2.04192 6.58388 1.74713 6.33376C1.45234 6.08364 1.41614 5.6419 1.66626 5.34712C4.7523 1.70999 10.8005 1.65204 14.2558 5.10485C14.5293 5.37811 14.5295 5.82133 14.2562 6.0948C13.9829 6.36826 13.5397 6.36842 13.2663 6.09515ZM2.68883 7.76795C3.70851 5.96468 5.78313 4.9 8.24017 4.9C11.2717 4.9 13.9802 7.15697 13.9802 10.4C13.9802 11.5819 13.0221 12.54 11.8402 12.54C11.4529 12.54 11.1032 12.4574 10.7964 12.2866C10.4915 12.1169 10.2677 11.8817 10.099 11.6331C9.8218 11.2246 9.65322 10.7063 9.5195 10.2952C9.50207 10.2416 9.48524 10.1898 9.46884 10.1404C9.30675 9.65176 9.16562 9.30152 8.95514 9.06122C8.78349 8.86524 8.52792 8.7 8.00017 8.7C7.21458 8.7 6.76836 8.9692 6.50665 9.31215C6.22497 9.68127 6.07808 10.2409 6.11707 10.9358C6.19628 12.3475 7.02087 13.9534 8.18338 14.7143C8.50684 14.926 8.59743 15.3599 8.38571 15.6834C8.17398 16.0068 7.74012 16.0974 7.41665 15.8857C5.82916 14.8466 4.8196 12.8025 4.71927 11.0142C4.66849 10.1091 4.84548 9.18123 5.39369 8.46284C5.96186 7.7183 6.85153 7.3 8.00017 7.3C8.89756 7.3 9.5493 7.61476 10.0083 8.13878C10.4284 8.61848 10.6413 9.22824 10.7976 9.6996C10.8147 9.75105 10.8311 9.80088 10.8471 9.84914C10.9954 10.2991 11.0992 10.6137 11.2575 10.8469C11.333 10.9583 11.4049 11.0231 11.4773 11.0634C11.5478 11.1026 11.6569 11.14 11.8402 11.14C12.2489 11.14 12.5802 10.8087 12.5802 10.4C12.5802 8.03641 10.6092 6.3 8.24017 6.3C6.17207 6.3 4.62661 7.18532 3.90749 8.45705C3.19871 9.71051 3.1908 11.5242 4.58245 13.6117C4.7969 13.9334 4.70997 14.368 4.3883 14.5824C4.06663 14.7969 3.63203 14.71 3.41758 14.3883C1.80923 11.9758 1.65882 9.58949 2.68883 7.76795ZM8.00123 9.7C8.38783 9.70014 8.70112 10.0137 8.70097 10.4003C8.70076 10.9592 8.97356 11.5807 9.47715 12.1895C9.97528 12.7916 10.6511 13.3206 11.3294 13.6824C11.6705 13.8643 11.7996 14.2883 11.6177 14.6294C11.4357 14.9705 11.0117 15.0996 10.6706 14.9176C9.84894 14.4794 9.02494 13.8392 8.3984 13.0818C7.77732 12.331 7.3006 11.4026 7.30097 10.3997C7.30112 10.0131 7.61463 9.69985 8.00123 9.7Z" fill="currentColor"/>
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_skills_ds)">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.4582 1.56231C10.136 1.24882 9.70431 1.07341 9.25483 1.07341C8.80534 1.07341 8.37361 1.24882 8.05149 1.56231L1.63416 7.85565C1.52677 7.96002 1.38292 8.01842 1.23316 8.01842C1.0834 8.01842 0.939547 7.96002 0.832159 7.85565C0.779583 7.80451 0.737792 7.74336 0.709255 7.6758C0.680719 7.60824 0.666016 7.53565 0.666016 7.46231C0.666016 7.38897 0.680719 7.31638 0.709255 7.24882C0.737792 7.18126 0.779583 7.12011 0.832159 7.06898L7.24949 0.775645C7.7863 0.25324 8.50578 -0.0390625 9.25483 -0.0390625C10.0039 -0.0390625 10.7234 0.25324 11.2602 0.775645C11.5708 1.07771 11.8054 1.44904 11.9449 1.85924C12.0845 2.26943 12.1249 2.70684 12.0628 3.13565C12.4973 3.07385 12.9402 3.11264 13.3574 3.24903C13.7745 3.38542 14.1548 3.61576 14.4688 3.92231L14.5022 3.95565C14.765 4.2113 14.974 4.51706 15.1167 4.85485C15.2594 5.19265 15.3329 5.55562 15.3329 5.92231C15.3329 6.289 15.2594 6.65198 15.1167 6.98977C14.974 7.32756 14.765 7.63333 14.5022 7.88898L8.69816 13.5803C8.68064 13.5973 8.66671 13.6177 8.65721 13.6402C8.6477 13.6627 8.6428 13.6869 8.6428 13.7113C8.6428 13.7357 8.6477 13.7599 8.65721 13.7824C8.66671 13.8049 8.68064 13.8253 8.69816 13.8423L9.89016 15.0116C9.94274 15.0628 9.98453 15.1239 10.0131 15.1915C10.0416 15.259 10.0563 15.3316 10.0563 15.405C10.0563 15.4783 10.0416 15.5509 10.0131 15.6185C9.98453 15.686 9.94274 15.7472 9.89016 15.7983C9.78277 15.9027 9.63892 15.9611 9.48916 15.9611C9.3394 15.9611 9.19555 15.9027 9.08816 15.7983L7.89616 14.6296C7.77339 14.5103 7.67579 14.3676 7.60915 14.21C7.5425 14.0523 7.50817 13.8828 7.50817 13.7116C7.50817 13.5405 7.5425 13.371 7.60915 13.2133C7.67579 13.0557 7.77339 12.9129 7.89616 12.7936L13.7002 7.10165C13.8578 6.94821 13.9831 6.76473 14.0687 6.56206C14.1542 6.35939 14.1983 6.14163 14.1983 5.92165C14.1983 5.70166 14.1542 5.4839 14.0687 5.28123C13.9831 5.07856 13.8578 4.89508 13.7002 4.74165L13.6668 4.70898C13.3451 4.39582 12.9139 4.22042 12.4649 4.22005C12.0159 4.21968 11.5844 4.39435 11.2622 4.70698L6.48083 9.39631L6.47949 9.39764L6.41416 9.46231C6.30674 9.56689 6.16274 9.62541 6.01283 9.62541C5.86291 9.62541 5.71891 9.56689 5.61149 9.46231C5.55892 9.41118 5.51713 9.35003 5.48859 9.28247C5.46005 9.21491 5.44535 9.14232 5.44535 9.06898C5.44535 8.99564 5.46005 8.92305 5.48859 8.85549C5.51713 8.78793 5.55892 8.72678 5.61149 8.67564L10.4602 3.92031C10.6174 3.76677 10.7423 3.58332 10.8275 3.38076C10.9127 3.1782 10.9565 2.96064 10.9563 2.74089C10.9561 2.52114 10.9119 2.30365 10.8264 2.10124C10.7408 1.89883 10.6156 1.71559 10.4582 1.56231Z" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M9.65673 3.13531C9.7093 3.08418 9.75109 3.02303 9.77963 2.95547C9.80817 2.88791 9.82287 2.81531 9.82287 2.74198C9.82287 2.66864 9.80817 2.59604 9.77963 2.52848C9.75109 2.46093 9.7093 2.39977 9.65673 2.34864C9.54931 2.24406 9.40531 2.18555 9.25539 2.18555C9.10548 2.18555 8.96148 2.24406 8.85406 2.34864L4.10806 7.00331C3.84518 7.25896 3.63623 7.56472 3.49354 7.90252C3.35086 8.24031 3.27734 8.60328 3.27734 8.96998C3.27734 9.33667 3.35086 9.69964 3.49354 10.0374C3.63623 10.3752 3.84518 10.681 4.10806 10.9366C4.64495 11.4589 5.3644 11.7511 6.11339 11.7511C6.86239 11.7511 7.58184 11.4589 8.11873 10.9366L12.8654 6.28198C12.918 6.23085 12.9598 6.16969 12.9883 6.10213C13.0168 6.03458 13.0315 5.96198 13.0315 5.88864C13.0315 5.8153 13.0168 5.74271 12.9883 5.67515C12.9598 5.60759 12.918 5.54644 12.8654 5.49531C12.758 5.39073 12.614 5.33221 12.4641 5.33221C12.3141 5.33221 12.1701 5.39073 12.0627 5.49531L7.31673 10.15C6.99461 10.4635 6.56288 10.6389 6.11339 10.6389C5.66391 10.6389 5.23217 10.4635 4.91006 10.15C4.75242 9.99654 4.62712 9.81307 4.54156 9.6104C4.456 9.40772 4.41192 9.18997 4.41192 8.96998C4.41192 8.74999 4.456 8.53223 4.54156 8.32956C4.62712 8.12689 4.75242 7.94342 4.91006 7.78998L9.65673 3.13531Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_skills_ds"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

function McpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_mcp_ds)">
        <path d="M3.25 13H2.75C1.64543 13 0.75 12.1046 0.75 11L0.75 3C0.75 1.89543 1.64543 1 2.75 1H5.33579C5.601 1 5.85536 1.10536 6.04289 1.29289L6.75 2H13.25C14.3546 2 15.25 2.89543 15.25 4V6.23438" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <path d="M7.42188 9.2666L6.1385 11.0606C6.01404 11.2346 6.01404 11.4684 6.1385 11.6424L7.42188 13.4364" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.8203 9.2666L15.1037 11.0606C15.2282 11.2346 15.2282 11.4684 15.1037 11.6424L13.8203 13.4364" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.2129 7.97461L9.78793 15.0246" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <defs>
        <clipPath id="clip0_mcp_ds"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

function AutomationsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.82031 7.9834C6.28967 7.9834 6.66979 8.36368 6.66992 8.83301V10.166C6.66992 10.6355 6.28975 11.0166 5.82031 11.0166C5.35087 11.0166 4.9707 10.6355 4.9707 10.166V8.83301C4.97083 8.36368 5.35095 7.9834 5.82031 7.9834Z" fill="currentColor"/>
      <path d="M10.1641 7.9834C10.6334 7.9834 11.0135 8.36368 11.0137 8.83301V10.166C11.0137 10.6355 10.6335 11.0166 10.1641 11.0166C9.69462 11.0166 9.31445 10.6355 9.31445 10.166V8.83301C9.31458 8.36368 9.6947 7.9834 10.1641 7.9834Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M8 0C9.24264 0 10.25 1.00736 10.25 2.25V3H11.5C13.1569 3 14.5 4.34315 14.5 6V8.75H15.2529C15.6671 8.75 16.0029 9.08579 16.0029 9.5C16.0029 9.91421 15.6671 10.25 15.2529 10.25H14.5V13C14.5 14.6051 13.2394 15.9158 11.6543 15.9961L11.5 16H4.5L4.3457 15.9961C2.81166 15.9184 1.58163 14.6883 1.50391 13.1543L1.5 13V10.25H0.75C0.335786 10.25 0 9.91421 0 9.5C0 9.08579 0.335786 8.75 0.75 8.75H1.5V6C1.5 4.34315 2.84315 3 4.5 3H5.75V2.25C5.75 1.00736 6.75736 0 8 0ZM4.5 4.5C3.67157 4.5 3 5.17157 3 6V13C3 13.8284 3.67157 14.5 4.5 14.5H11.5C12.3284 14.5 13 13.8284 13 13V6C13 5.17157 12.3284 4.5 11.5 4.5H4.5ZM8 1.5C7.58579 1.5 7.25 1.83579 7.25 2.25V3H8.75V2.25C8.75 1.83579 8.41421 1.5 8 1.5Z" fill="currentColor"/>
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M10.5 7C12.433 7 14 8.567 14 10.5C14 12.433 12.433 14 10.5 14C8.82456 14 7.42548 12.8224 7.08203 11.25H1.625C1.21079 11.25 0.875 10.9142 0.875 10.5C0.875 10.0858 1.21079 9.75 1.625 9.75H7.08203C7.42548 8.17757 8.82456 7.00001 10.5 7ZM10.5 8.5C9.39544 8.50001 8.5 9.39544 8.5 10.5C8.5 11.6046 9.39544 12.5 10.5 12.5C11.6046 12.5 12.5 11.6046 12.5 10.5C12.5 9.39543 11.6046 8.5 10.5 8.5Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.5 0C5.17545 0 6.57452 1.17756 6.91797 2.75H12.375C12.7892 2.75 13.125 3.08579 13.125 3.5C13.125 3.91421 12.7892 4.25 12.375 4.25H6.91797C6.57452 5.82244 5.17545 7 3.5 7C1.567 7 0 5.433 0 3.5C0 1.567 1.567 0 3.5 0ZM3.5 1.5C2.39543 1.5 1.5 2.39543 1.5 3.5C1.5 4.60457 2.39543 5.5 3.5 5.5C4.60457 5.5 5.5 4.60457 5.5 3.5C5.5 2.39543 4.60457 1.5 3.5 1.5Z" fill="currentColor"/>
    </svg>
  );
}

function DesignSystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.1716 11.1153C14.5363 10.9119 15.1178 10.9175 15.4704 11.128C15.8229 11.3385 15.8126 11.6744 15.4479 11.878L9.49774 15.2002C8.66165 15.667 7.33254 15.6634 6.5036 15.1924L0.665713 11.8741C0.304266 11.6686 0.299213 11.3328 0.654971 11.1241C1.01087 10.9154 1.59328 10.9128 1.95478 11.1182L7.79267 14.4366C7.91102 14.5037 8.10101 14.5041 8.2204 14.4375L14.1716 11.1153Z" fill="currentColor"/>
      <path d="M14.1716 7.71879C14.5363 7.51532 15.1178 7.52099 15.4704 7.73148C15.8228 7.94203 15.8125 8.27795 15.4479 8.48148L9.49774 11.8028C8.66161 12.2696 7.33255 12.266 6.5036 11.795L0.665713 8.47758C0.304311 8.27217 0.299347 7.9363 0.654971 7.72758C1.01087 7.51895 1.59328 7.5163 1.95478 7.72172L7.79267 11.0391C7.91109 11.1064 8.10095 11.1068 8.2204 11.0401L14.1716 7.71879Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.48407 0.724647C7.32102 0.241476 8.67827 0.241571 9.51532 0.724647L14.7839 3.76566C15.6206 4.24885 15.6206 5.03248 14.7839 5.51566L9.51532 8.55766C8.67832 9.04047 7.32091 9.04061 6.48407 8.55766L1.21649 5.51566C0.379544 5.03249 0.379707 4.24889 1.21649 3.76566L6.48407 0.724647ZM8.21649 1.47465C8.09702 1.4057 7.90346 1.4058 7.78388 1.47465L2.51532 4.51566C2.39604 4.58467 2.39599 4.69667 2.51532 4.76566L7.78388 7.80765C7.90337 7.87621 8.09711 7.87631 8.21649 7.80765L13.485 4.76566C13.6041 4.69668 13.6041 4.58463 13.485 4.51566L8.21649 1.47465Z" fill="currentColor"/>
    </svg>
  );
}

function DashboardSwitcherIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#clip0_switcher_ds)">
        <path d="M4.01562 5.58594C4.01562 6.76868 4.01562 8.36941 4.01562 9.39124C4.01562 9.94353 4.46334 10.3906 5.01562 10.3906H14.2656C14.8179 10.3906 15.2656 9.94291 15.2656 9.39062V1.78125C15.2656 1.22897 14.8179 0.78125 14.2656 0.78125H5.01563C4.46334 0.78125 4.01562 1.22897 4.01562 1.78125V3.18359" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10.0156 5.58594L1.76563 5.58594C1.21334 5.58594 0.765626 6.03365 0.765626 6.58594L0.765625 14.1953C0.765625 14.7476 1.21334 15.1953 1.76562 15.1953L11.0156 15.1953C11.5679 15.1953 12.0156 14.7476 12.0156 14.1953L12.0156 12.793" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.00003 7.31155L10.7256 5.58594L9.00003 3.86032" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_switcher_ds"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

function SettingsGearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.99996 10C9.10453 10 9.99996 9.10457 9.99996 8C9.99996 6.89543 9.10453 6 7.99996 6C6.89539 6 5.99996 6.89543 5.99996 8C5.99996 9.10457 6.89539 10 7.99996 10ZM7.99996 11.5C9.93295 11.5 11.5 9.933 11.5 8C11.5 6.067 9.93295 4.5 7.99996 4.5C6.06696 4.5 4.49996 6.067 4.49996 8C4.49996 9.933 6.06696 11.5 7.99996 11.5Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.40917 14.5H8.59082L8.64285 13.6676C8.68604 12.9765 9.12642 12.4062 9.72215 12.1591C10.3207 11.9109 11.0352 12.0054 11.5529 12.4622L12.1784 13.014L13.0139 12.1785L12.4622 11.5531C12.0053 11.0354 11.9109 10.3208 12.1591 9.72222C12.4062 9.12646 12.9765 8.68604 13.6676 8.64285L14.5 8.59082V7.40918L13.6676 7.35715C12.9765 7.31396 12.4062 6.87355 12.1591 6.27781C11.9109 5.67926 12.0053 4.9647 12.4622 4.44695L13.0139 3.82163L12.1784 2.98608L11.553 3.53784C11.0353 3.99467 10.3207 4.0891 9.72218 3.84089C9.12644 3.59384 8.68604 3.02347 8.64285 2.33241L8.59082 1.5H7.40917L7.35715 2.33236C7.31396 3.02345 6.87354 3.59384 6.27778 3.8409C5.67921 4.08913 4.96463 3.99471 4.44686 3.53785L3.82153 2.98609L2.98598 3.82164L3.53784 4.44708C3.99465 4.9648 4.08908 5.67931 3.84088 6.27784C3.59384 6.87357 3.02348 7.31396 2.33245 7.35715L1.5 7.40917V8.59082L2.33241 8.64285C3.02346 8.68604 3.59383 9.12643 3.84089 9.72218C4.0891 10.3207 3.99467 11.0353 3.53784 11.553L2.98597 12.1785L3.82152 13.014L4.44696 12.4622C4.9647 12.0053 5.67925 11.9109 6.27781 12.1591C6.87356 12.4062 7.31396 12.9765 7.35715 13.6676L7.40917 14.5Z" fill="currentColor"/>
    </svg>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ComponentRow({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: 8, fontFamily: 'monospace', letterSpacing: '0.01em' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Container({ children, style }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-surface-2)',
        borderRadius: 8,
        padding: 16,
        background: 'var(--color-surface-0)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function IconGrid({ icons }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      {icons.map(({ label, icon }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 72 }}>
          <span style={{ color: 'var(--color-icon-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
            {icon}
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Interactive ChatItem + Menu Demo ─────────────────────────────────────────

const DEMO_CHATS = [
  { id: 'a', title: 'Failed payments over $500', timestamp: 'Today · 2:38 PM' },
  { id: 'b', title: 'Suspicious refund activity', timestamp: 'Today · 11:05 AM' },
  { id: 'c', title: 'MRR breakdown by plan', timestamp: 'Today · 9:12 AM' },
];

function ChatItemDemo() {
  const [activeId, setActiveId] = useState('a');
  const [running, setRunning] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleMenuClick(id, e) {
    e.stopPropagation();
    if (menuOpenId === id) {
      setMenuOpenId(null);
      setConfirmOpen(false);
    } else {
      setMenuOpenId(id);
      setConfirmOpen(false);
    }
  }

  function closeMenu() {
    setMenuOpenId(null);
    setConfirmOpen(false);
  }

  return (
    <>
    <button type="button" className="composer-example__control-button" style={{ marginBottom: 12 }} onClick={() => setRunning(value => !value)}>
      {running ? 'Complete sample queries' : 'Restart sample queries'}
    </button>
    <div style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Container style={{ width: 240, padding: 4 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          {DEMO_CHATS.map((chat) => (
            <div
              key={chat.id}
              className={`sidebar-item ${activeId === chat.id ? 'active' : ''}`}
              style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
              onClick={() => { setActiveId(chat.id); closeMenu(); }}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }} className="text-text-secondary truncate">
                {chat.title}
              </div>
              <ChatStatus title={chat.title} timestamp={chat.timestamp} phase={chat.id === 'c' ? undefined : running ? 'thinking' : 'complete'} />
              <div
                className={`item-menu-btn ${menuOpenId === chat.id ? 'active' : ''}`}
                onClick={(e) => handleMenuClick(chat.id, e)}
              >
                <MenuDotsIcon size={14} />
              </div>
            </div>
          ))}
        </div>
      </Container>

      {menuOpenId && (
        <div
          style={{
            width: 140,
            background: '#1a1a1d',
            border: '1px solid var(--color-border-default)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="item-popup-row"
            style={{ padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}
            onClick={closeMenu}
          >
            Rename
          </div>
          <div style={{ height: 1, background: 'var(--color-border-default)', margin: '4px 10px' }} />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                padding: '6px 10px', borderRadius: 4, fontSize: 13, color: '#e45858', cursor: 'pointer',
                opacity: confirmOpen ? 0 : 1, pointerEvents: confirmOpen ? 'none' : 'auto',
                transition: 'opacity 120ms ease',
              }}
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </div>
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '6px 10px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
                opacity: confirmOpen ? 1 : 0, pointerEvents: confirmOpen ? 'auto' : 'none',
                transition: 'opacity 120ms ease',
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>Delete?</span>
              <span style={{ color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={closeMenu}>Yes</span>
              <span style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer' }} onClick={() => setConfirmOpen(false)}>No</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

const TAB_PILL_ITEMS = [
  { id: 't1', label: 'Growth overview', Icon: CanvasTabIconBarChart },
  { id: 't2', label: 'Revenue over time', Icon: CanvasTabIconList },
  { id: 't3', label: 'API health', Icon: CanvasTabIconBarChart },
];

const TAB_PILL_OVERFLOW = [
  { id: 'o1', label: 'Tax skill', Icon: CanvasTabIconNote },
  { id: 'o2', label: 'Failed payments query', Icon: CanvasTabIconCode },
  { id: 'o3', label: 'Radar ruleset diff', Icon: CanvasTabIconNote },
];

function SegmentSwitchDemo() {
  const [value, setValue] = useState('allow');
  const options = [
    { id: 'allow', label: 'Allow' },
    { id: 'ask', label: 'Ask' },
    { id: 'block', label: 'Block' },
  ];

  return (
    <Container style={{ padding: 16, display: 'inline-flex' }}>
      <SegmentSwitch options={options} value={value} onChange={setValue} />
    </Container>
  );
}

// The five attribution types, each derived from its own source items.
const SOURCE_TYPE_EXAMPLES = [
  {
    rule: 'Only a named place or object',
    items: [{ label: 'Growth metrics', type: 'dashboard' }],
  },
  {
    rule: 'Only Stripe docs pages',
    items: [
      { label: 'Radar rule configuration', type: 'doc' },
      { label: 'Shipping label exports', type: 'doc' },
    ],
  },
  {
    rule: 'Only Sigma queries',
    items: [
      { label: 'Revenue trend', type: 'code', sqlId: 'sql-revenue-trend' },
      { label: 'API latency', type: 'code', sqlId: 'sql-api-latency' },
    ],
  },
  {
    rule: 'Primarily Stripe API calls',
    items: [
      { label: 'Webhook endpoints', type: 'api' },
      { label: 'Subscriber cohorts', type: 'api' },
    ],
  },
  {
    rule: 'More than one type present',
    items: [
      { label: 'Billing Overview', type: 'dashboard' },
      { label: 'Payment volume trends', type: 'code', sqlId: 'sql-revenue-trend' },
      { label: 'Customer growth', type: 'api' },
    ],
  },
];

const SOURCE_ITEM_TYPES = [
  { type: 'dashboard', label: 'Growth metrics', interaction: 'Links to the dashboard page' },
  { type: 'doc', label: 'Multi-currency settlement', interaction: 'Links to the docs page' },
  { type: 'code', label: 'Revenue trend', sqlId: 'sql-revenue-trend', interaction: 'Opens the SQL as a canvas tab' },
  { type: 'api', label: 'Webhook endpoints', interaction: 'Reveals the agent reasoning' },
];

function SourceTransparencyDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ComponentRow label="Five attribution types — label derives from the items">
        <Container style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SOURCE_TYPE_EXAMPLES.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--color-text-secondary)', minWidth: 150 }}>
                  {deriveAttribution(ex.items)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{ex.rule}</span>
              </div>
            ))}
          </div>
        </Container>
      </ComponentRow>

      <ComponentRow label="Collapsed — click the line to expand (conversation)">
        <Container style={{ padding: 16 }}>
          <ArtifactChips
            sourceItems={SOURCE_TYPE_EXAMPLES[4].items}
            isLatest={false}
          />
        </Container>
      </ComponentRow>

      <ComponentRow label="Source item types and their interactions">
        <Container style={{ padding: 16 }}>
          <div className="source-expand-section source-expand-section--inline">
            {SOURCE_ITEM_TYPES.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 200 }}>
                  <SourceItemRow item={it} size={10} className="source-expand-item" />
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{it.interaction}</span>
              </div>
            ))}
          </div>
        </Container>
      </ComponentRow>

      <ComponentRow label="Canvas stamp — popover anchored to the attribution label">
        {/* Padded out so the absolutely positioned popover has room to hang. */}
        <Container style={{ padding: '16px 16px 180px' }}>
          {/* Stamps sit right-aligned as they do on the canvas, so the popover
              opens leftward and stays inside the frame. */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }}><ClockIcon size={10} /></span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Generated 2m ago</span>
            </span>
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center' }}><SourceIcon size={10} /></span>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {deriveAttribution(SOURCE_ITEM_TYPES)}
              </span>
              {/* Right-aligned to match the canvas, which keeps it on screen. */}
              <div
                className="source-tooltip-popover source-tooltip-popover--below"
                style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 320 }}
              >
                <div className="source-tooltip-header">{SOURCE_ITEM_TYPES.length} sources</div>
                {/* No-op handlers so the Sigma and API rows render their hover
                    affordance; dashboard and doc rows stay inert, as in product. */}
                {SOURCE_ITEM_TYPES.map((item, i) => (
                  <SourceItemRow
                    key={i}
                    item={item}
                    size={11}
                    onOpenSourceTab={() => {}}
                    onApiClick={() => {}}
                  />
                ))}
              </div>
            </span>
          </div>
        </Container>
      </ComponentRow>
    </div>
  );
}

function TabPillDemo() {
  const [activeId, setActiveId] = useState('t1');
  const [overflowOpen, setOverflowOpen] = useState(false);

  return (
    <Container style={{ padding: '12px 16px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {TAB_PILL_ITEMS.map(({ id, label, Icon }) => (
          <div
            key={id}
            className={`tab-pill ${activeId === id ? 'active' : 'inactive'}`}
            onClick={() => { setActiveId(id); setOverflowOpen(false); }}
            role="tab"
            aria-selected={activeId === id}
          >
            <div className="tab-pill__anim">
              <span className="tab-pill__main">
                <span className="tab-pill__icon"><Icon size={12} /></span>
                <span className="tab-pill__label">{label}</span>
              </span>
              <div className="tab-pill__closeLayer">
                <div className="tab-pill__closeGrad" />
                <button type="button" className="tab-close" onClick={(e) => e.stopPropagation()}>
                  <CloseIcon size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="tab-bar-more"
          onClick={() => setOverflowOpen(!overflowOpen)}
        >
          <span className="tab-bar-more__main">
            <span className="tab-bar-more__label">{TAB_PILL_OVERFLOW.length} more</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ marginLeft: 2 }}>
              <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      </div>

      {overflowOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 16,
            marginTop: 4,
            width: 240,
            background: '#1a1a1d',
            border: '1px solid var(--color-border-default)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          {TAB_PILL_OVERFLOW.map(({ id, label, Icon }) => (
            <div
              key={id}
              style={{
                padding: '6px 10px', borderRadius: 4, fontSize: 13, display: 'flex',
                alignItems: 'center', gap: 8, cursor: 'pointer',
                color: activeId === id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
              onClick={() => { setActiveId(id); setOverflowOpen(false); }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-tertiary)' }}><Icon size={12} /></span>
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-tertiary)' }} onClick={(e) => e.stopPropagation()}>
                <CloseIcon size={10} />
              </span>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

// The Figma frame only specifies step 1. The remaining steps carry the same
// retry scenario forward so the pager is actually navigable in the catalog.
const ASK_QUESTION_STEPS = [
  {
    subtitle: 'Attempt the charge again with exponential backoff',
    options: ['Generate with console', 'Manual configuration'],
  },
  {
    subtitle: 'How many retries before the invoice is marked uncollectible',
    options: ['Three over seven days', 'Five over fourteen days'],
  },
  {
    subtitle: 'Notify the customer on each failed attempt',
    options: ['Email on every attempt', 'Email on the final attempt only'],
  },
  {
    subtitle: 'Apply this to existing subscriptions or new ones only',
    options: ['All active subscriptions', 'New subscriptions only'],
  },
];

function AskQuestionStepsDemo() {
  const [step, setStep] = useState(1);
  const current = ASK_QUESTION_STEPS[step - 1];
  return (
    <AskQuestion
      key={step}
      title="Questions"
      subtitle={current.subtitle}
      options={current.options}
      step={step}
      stepCount={ASK_QUESTION_STEPS.length}
      onStepChange={setStep}
    />
  );
}

function MenuDemo({ freshnessLabel }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Container style={{ width: 160, padding: 4 }}>
      <div
        className="item-popup-row"
        style={{ padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}
      >
        Rename
      </div>
      <div
        className="item-popup-row"
        style={{ padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}
      >
        Save to library
      </div>
      <div
        className="item-popup-row"
        style={{ padding: '6px 10px', borderRadius: 4, fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer' }}
      >
        Open in new tab
      </div>
      {!freshnessLabel && <div style={{ height: 1, background: 'var(--color-border-default)', margin: '4px 10px' }} />}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            padding: '6px 10px', borderRadius: 4, fontSize: 13, color: '#e45858', cursor: 'pointer',
            opacity: confirmOpen ? 0 : 1, pointerEvents: confirmOpen ? 'none' : 'auto',
            transition: 'opacity 120ms ease',
          }}
          onClick={() => setConfirmOpen(true)}
        >
          Remove
        </div>
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '6px 10px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
            opacity: confirmOpen ? 1 : 0, pointerEvents: confirmOpen ? 'auto' : 'none',
            transition: 'opacity 120ms ease',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>Remove?</span>
          <span style={{ color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setConfirmOpen(false)}>Yes</span>
          <span style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer' }} onClick={() => setConfirmOpen(false)}>No</span>
        </div>
      </div>
      {freshnessLabel && (
        <>
          <div style={{ height: 1, background: 'var(--color-border-default)', margin: '4px 10px' }} />
          <div
            style={{
              padding: '6px 10px',
              fontSize: 11,
              color: 'var(--color-text-quaternary, var(--color-text-tertiary))',
              pointerEvents: 'none',
              cursor: 'default',
            }}
          >
            {freshnessLabel}
          </div>
        </>
      )}
    </Container>
  );
}

function SlashMenuDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  return <SkillMenu items={DESIGN_SYSTEM_COMMANDS} activeIdx={activeIdx} onActiveChange={setActiveIdx} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DesignSystemPage() {
  const [futureTasks, setFutureTasks] = useFutureTasks();
  const [sampleFeedback, setSampleFeedback] = useState(null);

  return (
    <div style={{ overflow: 'auto', height: '100%', width: '100%' }}>
      <div style={{ padding: '48px 40px', maxWidth: 760 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
        Design System
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
        Shared components, organized around the Console workflow.
      </p>
      <nav aria-label="Design System sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 40, fontSize: 12 }}>
        <a href="#design-system-conversation" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Conversation</a>
        <a href="#design-system-canvas" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Canvas</a>
        <a href="#design-system-navigation" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Navigation</a>
        <a href="#design-system-controls" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Controls</a>
        <a href="#design-system-foundations" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Foundations</a>
      </nav>

      <section id="design-system-conversation" aria-labelledby="design-system-conversation-heading" style={{ marginBottom: 64, scrollMarginTop: 24 }}>
        <h2 id="design-system-conversation-heading" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>Conversation</h2>
      <Section title="Composer">
        <p className="composer-example__description">
          The same composer used in conversations. Send a sample query to try the stop button.
        </p>
        <ComponentRow label="New conversation">
          <ComposerExample />
        </ComponentRow>
        <ComponentRow label="Follow-up · anchored to bottom">
          <ComposerExample followUp />
        </ComponentRow>
        <p className="composer-example__description">
          Enter sends; Shift + Enter adds a line. Use + or / for commands and @ for artifacts.
          Stop cancels a running response. Typing switches back to Send.
        </p>
      </Section>

      <Section title="User Prompt">
        <ComponentRow label="Collapsed (default)">
          <Container style={{ maxWidth: 520 }}>
            <div
              className="user-message linear-border"
              style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
                Pull all failed payments over $500 from last month and break them down by decline code.
              </span>
            </div>
          </Container>
        </ComponentRow>
        <ComponentRow label="Expanded">
          <Container style={{ maxWidth: 520 }}>
            <div
              className="user-message linear-border expanded"
              style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
                Pull all failed payments over $500 from last month and break them down by decline code. Include the customer name, BIN, and issuer for each transaction so we can identify patterns.
              </span>
            </div>
          </Container>
        </ComponentRow>
      </Section>

      <Section title="Thinking Indicator">
        <Container style={{ maxWidth: 520 }}>
          <ThinkingIndicator label="Crystallizing..." />
        </Container>
      </Section>

      <Section title="Task Block">
        <label className="composer-example__controls" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={futureTasks} onChange={event => setFutureTasks(event.target.checked)} />
          Use future task block throughout Console
        </label>
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          {futureTasks ? 'Streamed progress, nested task details, anchored heading, elapsed timers, and automatic collapse when the answer can stay in place.' : 'The current task block. Switch on the future version to try it in every conversation.'}
        </p>
        <ComponentRow label="Live tool-call sequence">
          <Container style={{ maxWidth: 520 }}>
            <TaskSequenceExample />
          </Container>
        </ComponentRow>
        {futureTasks ? <>
          <ComponentRow label="Collapsed">
            <Container style={{ maxWidth: 520 }}>
              <TaskDisclosure group title="Check card expirations" timer={7800}>
                <TaskDisclosure title="Find customers with expired cards" timer={2300}>
                  <TaskCodeBlock title="Querying expiring cards" code={QUERY_SQL} />
                </TaskDisclosure>
              </TaskDisclosure>
            </Container>
          </ComponentRow>
          <ComponentRow label="Expanded (with nested details)">
            <Container style={{ maxWidth: 520 }}>
              <TaskDisclosure group defaultExpanded title="Check card expirations" timer={7800}>
                <p className="task-body-text">Checking for cards that have already expired.</p>
                <TaskDisclosure defaultExpanded title="Find customers with expired cards" timer={2300}>
                  <TaskCodeBlock title="Querying expiring cards" code={QUERY_SQL} />
                  <p className="task-body-text">Found 1 customer card with a January 2026 expiration date.</p>
                </TaskDisclosure>
              </TaskDisclosure>
            </Container>
          </ComponentRow>
        </> : <>
        <ComponentRow label="Collapsed">
          <Container style={{ maxWidth: 520 }}>
            <div className="task-module">
              <div className="task-header">
                <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
                </div>
                <div className="task-header-left">
                  <div className="task-header-top">
                    <span className="task-label">Task</span>
                    <span className="task-name text-shimmer">Querying failed payments</span>
                  </div>
                  <div className="task-subtitle-wrap">
                    <div className="task-subtitle task-subtitle-default">
                      <TaskSubtitleArrow />
                      Used 3 tools
                    </div>
                    <div className="task-subtitle task-subtitle-hover">
                      <TaskSubtitleArrow />
                      Click to expand
                    </div>
                  </div>
                </div>
                <TaskExpandIcon size={12} />
              </div>
            </div>
          </Container>
        </ComponentRow>
        <ComponentRow label="Expanded (with code blocks)">
          <Container style={{ maxWidth: 520 }}>
            <div className="task-module expanded">
              <div className="task-header">
                <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
                </div>
                <div className="task-header-left">
                  <div className="task-header-top">
                    <span className="task-label">Task</span>
                    <span className="task-name text-shimmer">Querying failed payments</span>
                  </div>
                  <div className="task-subtitle-wrap">
                    <div className="task-subtitle task-subtitle-default">
                      <TaskSubtitleArrow />
                      Used 3 tools
                    </div>
                  </div>
                </div>
                <TaskExpandIcon size={12} />
              </div>
              <div className="task-detail">
                <div className="task-detail-inner">
                  {/* 1 — Intent */}
                  <div className="task-body-text">
                    The user is asking for failed payments above $500 last month. I will pull the charges from the Stripe API with a date filter, then aggregate them by failure code.
                  </div>
                  {/* 2 — Tool call */}
                  <div className="code-inline">Fetching charges</div>
                  {/* 3 — Verdict */}
                  <div className="task-body-text">
                    Retrieved 100 charges for the period, 6 of which failed above the $500 threshold.
                  </div>
                  {/* 4 — Recovery: name the failure, then name the alternate path */}
                  <div className="code-inline">Fetching issuer decline descriptions</div>
                  <div className="task-body-text">
                    The issuer decline descriptions couldn't be fetched because the metadata service is rate limited, so I'll aggregate on the raw decline codes already present on each charge instead.
                  </div>
                  <div className="code-block code-block-single" style={{ marginTop: 10 }}>
                    <div className="code-header">
                      <span>Querying Failure codes</span>
                      <div className="code-actions">
                        <button className="code-action-expand" title="Open artifact">
                          <ExpandArrowIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 5 — Handoff, with an inline link to a named place */}
                  <div className="task-body-text">
                    Aggregation complete with generic_decline leading at 4 occurrences; richer issuer context is available in the{' '}
                    <a style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>Payments dashboard</a>.
                  </div>
                  <div className="task-body-text">
                    I have everything I need. I'll summarize the decline pattern and attach the failed payments table.
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </ComponentRow>
        </>}
      </Section>

      <Section title="Agent Response — Text">
        <ComponentRow label="Single paragraph">
          <Container style={{ maxWidth: 520 }}>
            <div className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
              <MessageIndicator isLatest={false} />
              <div className="console-response flex-1" style={{ minWidth: 0 }}>
                <p>
                  I found 6 failed payments over $500 last month. The most common decline code was "generic_decline" (4 occurrences), followed by "do_not_honor" (1) and "insufficient_funds" (1).
                </p>
              </div>
            </div>
          </Container>
        </ComponentRow>
        <ComponentRow label="With bullets">
          <Container style={{ maxWidth: 520 }}>
            <div className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
              <MessageIndicator isLatest={false} />
              <div className="console-response flex-1" style={{ minWidth: 0 }}>
                <p>Here's the breakdown by decline code:</p>
                <ul>
                  <li><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>generic_decline:</span> 4 charges totaling $18,600</li>
                  <li><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>do_not_honor:</span> 1 charge of $4,100.75</li>
                  <li><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>insufficient_funds:</span> 1 charge of $2,300</li>
                </ul>
              </div>
            </div>
          </Container>
        </ComponentRow>
        <ComponentRow label="With artifact chips">
          <Container style={{ maxWidth: 520 }}>
            <div className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
              <MessageIndicator isLatest={true} />
              <div className="console-response flex-1" style={{ minWidth: 0 }}>
                <p>I've put together a chart and table with the full details:</p>
                <ArtifactChips isLatest={true} sourceItems={SOURCE_TYPE_EXAMPLES[4].items}>
                  <div className="artifact-ref" data-artifact="chart">
                    <ArtifactChartIcon />
                    <span>Revenue chart</span>
                  </div>
                  <div className="artifact-ref" data-artifact="table">
                    <ArtifactTableIcon />
                    <span>Failed payments</span>
                  </div>
                </ArtifactChips>
              </div>
            </div>
          </Container>
        </ComponentRow>
      </Section>

      <Section title="Agent Response — Inline Table">
        <Container style={{ maxWidth: 520 }}>
          <div className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
            <MessageIndicator isLatest={false} />
            <div className="console-response flex-1" style={{ minWidth: 0 }}>
              <p>Here are the top customers by failed revenue:</p>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Failed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><a className="ext-link" href="#" onClick={(e) => e.preventDefault()}>Chloe Brown</a></td>
                    <td>chloe.brown@example.com</td>
                    <td>$4,800</td>
                  </tr>
                  <tr>
                    <td><a className="ext-link" href="#" onClick={(e) => e.preventDefault()}>Emma Davis</a></td>
                    <td>emma.davis@example.com</td>
                    <td>$4,500</td>
                  </tr>
                  <tr>
                    <td><a className="ext-link" href="#" onClick={(e) => e.preventDefault()}>Frank Wilson</a></td>
                    <td>frank.wilson@example.com</td>
                    <td>$4,500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      <Section title="Agent Response — Inline Code">
        <Container style={{ maxWidth: 520 }}>
          <div className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
            <MessageIndicator isLatest={false} />
            <div className="console-response flex-1" style={{ minWidth: 0 }}>
              <p>The decline code <code>card_declined</code> is a catch-all. You can inspect the raw response with:</p>
              <div className="code-block" style={{ marginTop: 10 }}>
                <div className="code-header">
                  <span>failedpayments.sql</span>
                  <div className="code-actions">
                    <button className="code-action-expand" title="Open artifact">
                      <ExpandArrowIcon size={12} />
                    </button>
                  </div>
                </div>
                <div className="code-body">
                  <pre><span className="ln">1</span>{`  SELECT customer_name, amount, decline_code`}
{`\n`}<span className="ln">2</span>{`  FROM charges`}
{`\n`}<span className="ln">3</span>{`  WHERE status = 'failed'`}
{`\n`}<span className="ln">4</span>{`    AND amount > 50000`}
{`\n`}<span className="ln">5</span>{`  ORDER BY created DESC;`}</pre>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section title="AskQuestion">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 16px', maxWidth: 720, lineHeight: 1.6 }}>
          Separate from Elicitation. Where Elicitation confirms a pending action, AskQuestion
          gathers context through pre-seeded options so the agent has enough to build a plan.
          Numbered options plus a free-form row the user can type into.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ComponentRow label="Single">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <AskQuestion options={['Fix login bug', 'Add search filter', 'Update API response']} />
            </Container>
          </ComponentRow>

          <ComponentRow label="Multi-choice">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <AskQuestion
                selectable
                freeform={false}
                options={['Card', 'Bank transfer (ACH)', 'Mobile wallet payments', 'Buy now, pay later']}
              />
            </Container>
          </ComponentRow>

          <ComponentRow label="Steps">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <AskQuestionStepsDemo />
            </Container>
          </ComponentRow>
        </div>
      </Section>

      <Section title="Elicitation">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 16px', maxWidth: 720, lineHeight: 1.6 }}>
          How the agent asks for a decision on an action it is about to take — primarily
          confirm or cancel. Elicitation replaces traditional forms across Console. All three
          variants share one card: options lift a tier when engaged, a fixed 22px slot on the
          right holds the shortcut, and the keyboard hint sits outside the card. Arrow keys
          and enter, or click a row.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ComponentRow label="Basic">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <Elicitation options={['Proceed', 'Cancel']} />
            </Container>
          </ComponentRow>

          <ComponentRow label="With disclaimer">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <Elicitation
                options={['Proceed', 'Cancel']}
                disclaimer="You are about to start a $19.99 USD per month subscription for jon@gmail.com. The first charge of $19.99 USD will take place on April 30, 2026."
              />
            </Container>
          </ComponentRow>

          <ComponentRow label="Risk — type to confirm">
            <Container style={{ maxWidth: 620, padding: 16 }}>
              <RiskElicitation
                autoFocus={false}
                token="sub_1TON"
                disclaimer="You are about to migrate subscription sub_1TONW3CICIKljWvsxkcCtaKy to a new billing version this change affects all future billing cycles and cannot be reversed."
              />
            </Container>
          </ComponentRow>
        </div>
      </Section>

      <Section title="Artifact Chips">
        <Container style={{ maxWidth: 480 }}>
          <ArtifactChips isLatest={true} sourceItems={SOURCE_TYPE_EXAMPLES[4].items}>
            <div className="artifact-ref" data-artifact="chart">
              <ArtifactChartIcon />
              <span>Growth overview</span>
            </div>
            <div className="artifact-ref" data-artifact="table">
              <ArtifactTableIcon />
              <span>Failed payments</span>
            </div>
            <div className="artifact-ref" data-artifact="text">
              <ArtifactTextIcon />
              <span>tax-skill.md</span>
            </div>
          </ArtifactChips>
        </Container>
      </Section>

      <Section title="Source Transparency">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16, maxWidth: 520, lineHeight: 1.7 }}>
          The same source data appears in two form factors: expanded inline beneath the attribution line in
          conversation, and as a hover popover from the stamp on canvas. Pass <code>sourceItems</code> rather than a
          hand-written label — <code>deriveAttribution</code> resolves which of the five types applies, so the
          vocabulary stays consistent everywhere.
        </p>
        <SourceTransparencyDemo />
      </Section>

      <Section title="Feedback Thumbs">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setSampleFeedback(sampleFeedback === 'up' ? null : 'up')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 4,
              color: sampleFeedback === 'up' ? 'var(--color-icon-default)' : 'var(--color-text-tertiary)',
            }}
          >
            <ThumbsUpIcon size={14} />
          </button>
          <button
            onClick={() => setSampleFeedback(sampleFeedback === 'down' ? null : 'down')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 4,
              color: sampleFeedback === 'down' ? 'var(--color-icon-default)' : 'var(--color-text-tertiary)',
            }}
          >
            <ThumbsDownIcon size={14} />
          </button>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {sampleFeedback ? `Selected: ${sampleFeedback}` : 'None selected'}
          </span>
        </div>
      </Section>

      <Section title="Message Indicator">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <ComponentRow label="Latest (active)">
            <MessageIndicator isLatest={true} />
          </ComponentRow>
          <ComponentRow label="Older (muted)">
            <MessageIndicator isLatest={false} />
          </ComponentRow>
        </div>
      </Section>
      </section>

      <section id="design-system-canvas" aria-labelledby="design-system-canvas-heading" style={{ marginBottom: 64, scrollMarginTop: 24 }}>
        <h2 id="design-system-canvas-heading" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>Canvas</h2>
      <Section title="Tab Pill">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Click tabs to switch active state. Hover to see close. Click "more" to see overflow menu.
        </p>
        <TabPillDemo />
      </Section>

      <Section title="Charts">
        <ComponentRow label="Line Chart">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>
            Two-series line chart with tooltip, gridlines, and legend. Used for time-series metrics (revenue, active merchants, latency, error rate). When rendered as the only chart on a canvas tab, the header (title + subtitle) is suppressed — the canvas content header serves as the title instead.
          </p>
          <div>
            <Chart
              title="Active merchants"
              subtitle="Dec 2025"
              series1Label="This period"
              series2Label="Previous period"
              chartDataKey="northStar"
              plotSize="hero"
            />
          </div>
        </ComponentRow>

        <ComponentRow label="Bar Chart">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>
            Single-series bar chart with tooltip, gridlines, and legend. Used for categorical data (conversion funnels, queue depth, throughput by region). Same standalone behavior — header hidden when it's the sole chart on a tab.
          </p>
          <div>
            <BarChart
              title="Conversion funnel"
              subtitle="Dec 2025"
              legendLabel="Users"
              barDataKey="conversion"
              plotSize="hero"
            />
          </div>
        </ComponentRow>

        <ComponentRow label="Standalone (no header)">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>
            When a single chart is the only artifact on a canvas tab, it renders with <span style={{ fontFamily: 'monospace' }}>standalone=true</span> — the card header is hidden and the chart fills the entire space. The canvas content header above provides the title context.
          </p>
          <div>
            <Chart
              title="Revenue over time"
              subtitle="Dec 2025"
              series1Label="Past 30 days"
              series2Label="Previous period"
              chartDataKey="default"
              plotSize="hero"
              standalone
            />
          </div>
        </ComponentRow>

        <ComponentRow label="Multi-Chart Layout">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>
            Charts are also rendered in 2×2 or 2×1 grid layouts within the canvas multi-chart tabs. Each cell can be either a line or bar chart variant. The layout uses resizable rows with drag handles.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Chart
                title="Revenue over time"
                subtitle="Dec 2025"
                series1Label="Past 30 days"
                series2Label="Previous period"
                chartDataKey="default"
                plotSize="half"
              />
            </div>
            <div>
              <BarChart
                title="Queue depth"
                subtitle="By hour"
                legendLabel="Requests"
                barDataKey="queueDepth"
                plotSize="half"
              />
            </div>
          </div>
        </ComponentRow>
      </Section>

      <Section title="Tables">
        <ComponentRow label="Data Table">
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>
            Sortable data table with status badges, clickable column headers, and per-row overflow menu on hover. Used in the canvas for payment data, customer lists, and query results.
          </p>
          <div style={{ overflow: 'auto' }}>
            <table className="canvas-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th data-col="customer">Customer</th>
                  <th data-col="amount">Amount</th>
                  <th data-col="status">Status ↓</th>
                  <th data-col="date">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Chloe Brown', '$4,800.00', 'Failed', 'Dec 19, 10:15 PM'],
                  ['Emma Davis', '$4,500.00', 'Failed', 'Dec 18, 9:30 PM'],
                  ['Frank Wilson', '$4,500.00', 'Failed', 'Dec 6, 9:45 AM'],
                  ['Henry Martinez', '$4,100.75', 'Failed', 'Dec 14, 5:30 PM'],
                  ['Noah Walker', '$2,800.00', 'Failed', 'Dec 4, 5:30 PM'],
                  ['Olivia Hall', '$2,300.00', 'Failed', 'Dec 20, 6:15 PM'],
                  ['Alice Johnson', '$5,600.00', 'Succeeded', 'Dec 12, 3:50 PM'],
                  ['Bob Smith', '$5,000.00', 'Succeeded', 'Dec 2, 1:15 PM'],
                  ['David Lee', '$4,800.00', 'Succeeded', 'Dec 23, 2:25 PM'],
                  ['Grace Taylor', '$4,200.50', 'Succeeded', 'Dec 23, 2:25 PM'],
                  ['Isabella Harris', '$3,750.00', 'Succeeded', 'Dec 9, 12:00 PM'],
                  ['Jack Williams', '$3,600.75', 'Succeeded', 'Dec 30, 1:25 PM'],
                ].map(([customer, amount, status, date]) => (
                  <tr key={customer}>
                    <td><span className="col-link">{customer}</span></td>
                    <td className="col-amount">{amount}</td>
                    <td><span className={`status-badge ${status === 'Failed' ? 'failed' : 'succeeded'}`}>{status}</span></td>
                    <td>{date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentRow>
      </Section>

      <Section title="Code Blocks">
        <ComponentRow label="Inline code">
          <Container style={{ maxWidth: 520 }}>
            <div className="code-inline">stripe charges list --created[gte]=1704067200 --limit=100</div>
          </Container>
        </ComponentRow>
        <ComponentRow label="Code block (collapsible, single line)">
          <Container style={{ maxWidth: 520 }}>
            <div className="code-block code-block-single" style={{ marginTop: 0 }}>
              <div className="code-header">
                <span>skill.md</span>
                <div className="code-actions">
                  <button className="code-action-expand" title="Open artifact">
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </ComponentRow>
        <ComponentRow label="Code block (expanded with body)">
          <Container style={{ maxWidth: 520 }}>
            <div className="code-block">
              <div className="code-header">
                <span>failedpayments.sql</span>
                <div className="code-actions">
                  <button className="code-action-expand" title="Open artifact">
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
              <div className="code-body">
                <pre><span className="ln">1</span>{`  SELECT customer_name, amount`}
{`\n`}<span className="ln">2</span>{`  FROM charges`}
{`\n`}<span className="ln">3</span>{`  WHERE status = 'failed'`}
{`\n`}<span className="ln">4</span>{`  ORDER BY created DESC;`}</pre>
              </div>
            </div>
          </Container>
        </ComponentRow>
      </Section>
      </section>

      <section id="design-system-navigation" aria-labelledby="design-system-navigation-heading" style={{ marginBottom: 64, scrollMarginTop: 24 }}>
        <h2 id="design-system-navigation-heading" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>Navigation</h2>
      <Section title="Chat Header">
        <Container style={{ maxWidth: 520 }}>
          <div
            className="conv-header flex items-center"
            style={{ padding: '17px 16px 10px 16px', height: 24, boxSizing: 'content-box', gap: 6 }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: '24px', color: 'var(--color-text-secondary)' }}>
              Failed payments over $500
            </span>
            <div style={{ marginLeft: 'auto' }}>
              <div className="conv-menu-btn" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}>
                <MenuDotsIcon size={14} />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section title="Sidebar Header">
        <Container style={{ width: 240, padding: '14px 18px 0' }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
            <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 4 }}>
              <g clipPath="url(#clip0_rr_ds)">
                <rect width="24" height="24" rx="4" fill="black"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M15.5294 8C17.7188 8 19.5 9.79437 19.5 12C19.5 14.2056 17.7188 16 15.5294 16H9.47896C9.23527 16 9.03786 15.801 9.03786 15.5555C9.03786 15.31 9.23527 15.1111 9.47896 15.1111H15.5294C17.2323 15.1111 18.6177 13.7155 18.6177 12C18.6177 10.2845 17.2323 8.88888 15.5294 8.88888H5.9496C5.70591 8.88888 5.50837 8.69 5.50837 8.4445C5.50837 8.199 5.70591 8 5.9496 8H15.5294ZM14.2059 12C14.2059 12.7351 14.7996 13.3334 15.5295 13.3334C16.2592 13.3334 16.8529 12.7351 16.8529 12C16.8529 11.2649 16.2592 10.6666 15.5295 10.6666C14.7996 10.6666 14.2059 11.2649 14.2059 12ZM17.7353 12C17.7353 13.2254 16.7457 14.2222 15.5295 14.2222C14.3131 14.2222 13.3236 13.2254 13.3236 12C13.3236 10.7746 14.3131 9.77775 15.5295 9.77775C16.7457 9.77775 17.7353 10.7746 17.7353 12ZM12.5042 10.6667H7.96643C7.72273 10.6667 7.5252 10.4677 7.5252 10.2222C7.5252 9.97669 7.72273 9.77781 7.96643 9.77781H12.5042C12.7479 9.77781 12.9454 9.97669 12.9454 10.2222C12.9454 10.4677 12.7479 10.6667 12.5042 10.6667Z" fill="white"/>
              </g>
              <defs><clipPath id="clip0_rr_ds"><rect width="24" height="24" rx="4" fill="white"/></clipPath></defs>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', flex: 1 }}>Rocket Rides</span>
            <span style={{ color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <SearchIcon size={12} />
            </span>
          </div>
          <div
            className="flex items-center justify-center linear-border"
            style={{ height: 32, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 12 }}
          >
            <span className="flex items-center text-text-primary" style={{ gap: 6 }}>
              <PlusIcon size={8} />
              New
            </span>
          </div>
        </Container>
      </Section>

      <Section title="ChatItem">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Hover rows to reveal the overflow. Click to select. Click the overflow to open the menu.
        </p>
        <ChatItemDemo />
      </Section>

      <Section title="NavRow">
        <Container style={{ width: 240 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavRow icon={<MemoryIcon />} label="Active item" active={true} onClick={() => {}} />
            <NavRow icon={<SkillsIcon />} label="Default item" onClick={() => {}} />
            <NavRow icon={<McpIcon />} label="Hover to preview" onClick={() => {}} />
          </div>
        </Container>
      </Section>
      </section>

      <section id="design-system-controls" aria-labelledby="design-system-controls-heading" style={{ marginBottom: 64, scrollMarginTop: 24 }}>
        <h2 id="design-system-controls-heading" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>Controls</h2>
      <Section title="Button">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <ComponentRow label="Disabled">
            <button
              type="button"
              className="tab-bar-save-btn"
              disabled
              style={{ pointerEvents: 'none' }}
            >
              Save
            </button>
          </ComponentRow>
          <ComponentRow label="Dirty (active)">
            <button
              type="button"
              className="tab-bar-save-btn tab-bar-save-btn--dirty"
            >
              Save
            </button>
          </ComponentRow>
        </div>
      </Section>

      <Section title="Segment Switch">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Compact toggle for multi-option settings. Selected state uses Surface/1 + shadow.
        </p>
        <SegmentSwitchDemo />
      </Section>

      <Section title="Slash Command Menu">
        <ComponentRow label="Default (all items)">
          <Container style={{ maxWidth: 400 }}>
            <SlashMenuDemo />
          </Container>
        </ComponentRow>
      </Section>

      <Section title="Menu">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Click Remove to see the confirm state. Click No to reset. Chart panels use the
          second variant, where the trailing separator carries a non-interactive freshness
          stamp instead of dividing off the destructive action.
        </p>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <ComponentRow label="Default">
            <MenuDemo />
          </ComponentRow>
          <ComponentRow label="With meta info">
            <MenuDemo freshnessLabel="Generated 2m ago" />
          </ComponentRow>
        </div>
      </Section>

      <Section title="Tooltips">
        <ComponentRow label="Source tooltip (frosted glass)">
          <Container style={{ padding: 16 }}>
            <div
              style={{
                width: 224,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border-default)',
                background: 'rgba(28, 28, 31, 0.72)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
              }}
            >
              From your API Monitoring data. Data as of 30 minutes ago.
            </div>
          </Container>
        </ComponentRow>

        <ComponentRow label="Nav tooltip (compact pill)">
          <Container style={{ padding: 16 }}>
            <div
              style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--color-surface-void)',
                border: '1px solid var(--color-border-default)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              Settings
            </div>
          </Container>
        </ComponentRow>
      </Section>

      <Section title="Rotating Tip">
        <Container style={{ maxWidth: 400 }}>
          <RotatingTipExample />
        </Container>
      </Section>
      </section>

      <section id="design-system-foundations" aria-labelledby="design-system-foundations-heading" style={{ marginBottom: 64, scrollMarginTop: 24 }}>
        <h2 id="design-system-foundations-heading" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>Foundations</h2>
      <Section title="Typography">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { name: 'Header', className: 'type-header', sample: 'The quick brown fox', meta: '15px / 600' },
            { name: 'Body Emphasized', className: 'type-body-emphasized', sample: 'The quick brown fox', meta: '13px / 600' },
            { name: 'Body Medium', className: 'type-body-medium', sample: 'The quick brown fox', meta: '13px / 500' },
            { name: 'Body Regular', className: 'type-body-regular', sample: 'The quick brown fox', meta: '13px / 400' },
            { name: 'Code', className: 'type-code', sample: 'const x = 42;', meta: '12px / 400 / mono' },
            { name: 'Table Header', className: 'type-table-header', sample: 'Column Name', meta: '12px / 500 / uppercase' },
            { name: 'Artifact Chip', className: 'type-artifact-chip', sample: 'Growth overview', meta: '12px / 500' },
            { name: 'Label', className: 'type-label-regular', sample: 'The quick brown fox', meta: '12px / 400' },
            { name: 'Label Medium', className: 'type-label-medium', sample: 'The quick brown fox', meta: '12px / 500' },
            { name: 'Subtext', className: 'type-subtext', sample: 'The quick brown fox', meta: '11px / 400' },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border-default)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className={t.className} style={{ color: 'var(--color-text-primary)' }}>{t.sample}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.meta}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Icons">
        <ComponentRow label="General UI">
          <IconGrid icons={[
            { label: 'Plus', icon: <PlusIcon size={8} /> },
            { label: 'Search', icon: <SearchIcon size={14} /> },
            { label: 'Close', icon: <CloseIcon size={14} /> },
            { label: 'Menu Dots', icon: <MenuDotsIcon size={14} /> },
            { label: 'Copy', icon: <CopyIcon size={14} /> },
            { label: 'Arrow Out', icon: <ExpandArrowIcon size={14} /> },
            { label: 'Eye Open', icon: <EyeOpenIcon size={14} /> },
            { label: 'Task Expand', icon: <TaskExpandIcon size={14} /> },
            { label: 'Subtitle Arrow', icon: <TaskSubtitleArrow /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Canvas Header / Metadata">
          <IconGrid icons={[
            { label: 'Created', icon: <CanvasHeaderCreatedIcon size={12} /> },
            { label: 'Clock', icon: <ClockIcon size={12} /> },
            { label: 'Source', icon: <SourceIcon size={12} /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Artifact Chips">
          <IconGrid icons={[
            { label: 'Chart', icon: <ArtifactChartIcon /> },
            { label: 'Table', icon: <ArtifactTableIcon /> },
            { label: 'Text', icon: <ArtifactTextIcon /> },
            { label: 'Code', icon: <ArtifactCodeIcon /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Canvas Tab Pills">
          <IconGrid icons={[
            { label: 'Bar Chart', icon: <CanvasTabIconBarChart size={14} /> },
            { label: 'List', icon: <CanvasTabIconList size={14} /> },
            { label: 'Note', icon: <CanvasTabIconNote size={14} /> },
            { label: 'Code', icon: <CanvasTabIconCode size={14} /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Feedback">
          <IconGrid icons={[
            { label: 'Thumbs Up', icon: <ThumbsUpIcon size={14} /> },
            { label: 'Thumbs Down', icon: <ThumbsDownIcon size={14} /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Sidebar Rail">
          <IconGrid icons={[
            { label: 'Dashboard Switcher', icon: <DashboardSwitcherIcon /> },
            { label: 'Settings Gear', icon: <SettingsGearIcon /> },
          ]} />
        </ComponentRow>

        <ComponentRow label="Settings Nav">
          <IconGrid icons={[
            { label: 'Back Arrow', icon: <BackArrowIcon /> },
            { label: 'Memory', icon: <MemoryIcon /> },
            { label: 'Skills', icon: <SkillsIcon /> },
            { label: 'MCP', icon: <McpIcon /> },
            { label: 'Automations', icon: <AutomationsIcon /> },
            { label: 'Preferences', icon: <PreferencesIcon /> },
            { label: 'Design System', icon: <DesignSystemIcon /> },
          ]} />
        </ComponentRow>
      </Section>

      <Section title="Semantic & Accent Tokens">
        <ComponentRow label="Semantic">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { name: 'Info', varName: 'var(--color-semantic-info)', hex: '#2B9DF6' },
              { name: 'Error', varName: 'var(--color-semantic-error)', hex: '#F23154' },
              { name: 'Warning', varName: 'var(--color-semantic-warning)', hex: '#FF6118' },
              { name: 'Success', varName: 'var(--color-semantic-success)', hex: '#12B76A' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Accent">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { name: 'Blurple', varName: 'var(--color-accent-blurple)', hex: '#533AFD' },
              { name: 'Lilac', varName: 'var(--color-accent-lilac)', hex: '#B68AFF' },
              { name: 'Blue', varName: 'var(--color-accent-blue)', hex: '#2B9DF6' },
              { name: 'Orange', varName: 'var(--color-accent-orange)', hex: '#FF6118' },
              { name: 'Yellow', varName: 'var(--color-accent-yellow)', hex: '#FFC01F' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>
      </Section>

      <Section title="Color Tokens — Dark Mode">
        <ComponentRow label="Surface">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Surface/Void', hex: 'var(--color-surface-void)' },
              { name: 'Surface/0', hex: 'var(--color-surface-0)' },
              { name: 'Surface/1', hex: 'var(--color-surface-1)' },
              { name: 'Surface/2', hex: 'var(--color-surface-2)' },
              { name: 'Surface/3', hex: 'var(--color-surface-3)' },
              { name: 'Surface/4', hex: 'var(--color-surface-4)' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid var(--color-border-default)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Text">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Primary', hex: 'var(--color-text-primary)' },
              { name: 'Secondary', hex: 'var(--color-text-secondary)' },
              { name: 'Tertiary', hex: 'var(--color-text-tertiary)' },
              { name: 'Link/Primary', hex: 'var(--color-text-link)' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid var(--color-border-default)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Icon">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Default', hex: 'var(--color-icon-default)' },
              { name: 'Subtle', hex: 'var(--color-icon-subtle)' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid var(--color-border-default)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Border">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Line/1', hex: 'var(--color-border-default)' },
              { name: 'Line/Hover', hex: 'var(--color-border-hover)' },
              { name: 'Line/2', hex: 'var(--color-border-subtle)' },
              { name: 'Inner Shadow', hex: 'var(--color-border-inner-shadow)' },
              { name: 'Rail', hex: 'var(--color-border-rail)' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid var(--color-border-default)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>
      </Section>

      <Section title="Color Tokens — Light Mode">
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16, lineHeight: 1.6 }}>
          Shadows are reduced across the board. linear-border shadow drops to 0.04 opacity.
          Context menus use white glass (rgba 255,255,255,0.92) instead of dark glass.
          Hover backgrounds flip from rgba(255,255,255,0.06) to rgba(0,0,0,0.03).
          Glow effects on the New button are disabled. Link/Primary becomes #635BFF (blurple).
        </p>
        <ComponentRow label="Surface">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Surface/Void', varName: 'var(--color-surface-void)', hex: '#FFFFFF' },
              { name: 'Surface/0', varName: 'var(--color-surface-0)', hex: '#F6F8FA' },
              { name: 'Surface/1', varName: 'var(--color-surface-1)', hex: '#F1F3F5' },
              { name: 'Surface/2', varName: 'var(--color-surface-2)', hex: '#E3E8EE' },
              { name: 'Surface/3', varName: 'var(--color-surface-3)', hex: '#C1C9D0' },
              { name: 'Surface/4', varName: 'var(--color-surface-4)', hex: '#697386' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid #E3E8EE' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Text">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Primary', varName: 'var(--color-text-primary)', hex: '#1A1F36' },
              { name: 'Secondary', varName: 'var(--color-text-secondary)', hex: '#4F566B' },
              { name: 'Tertiary', varName: 'var(--color-text-tertiary)', hex: '#8792A2' },
              { name: 'Link/Primary', varName: 'var(--color-text-link)', hex: '#635BFF' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid #E3E8EE' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Icon">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Default', varName: 'var(--color-icon-default)', hex: '#3C4257' },
              { name: 'Subtle', varName: 'var(--color-icon-subtle)', hex: '#8792A2' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid #E3E8EE' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>

        <ComponentRow label="Border">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { name: 'Line/1', varName: 'var(--color-border-default)', hex: '#E3E8EE' },
              { name: 'Line/Hover', varName: 'var(--color-border-hover)', hex: '#C1C9D0' },
              { name: 'Line/2', varName: 'var(--color-border-subtle)', hex: '#F0F2F5' },
              { name: 'Inner Shadow', varName: 'var(--color-border-inner-shadow)', hex: '#CFD7DF' },
              { name: 'Rail', varName: 'var(--color-border-rail)', hex: '#D8DEE4' },
            ].map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: t.hex, border: '1px solid #E3E8EE' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{t.varName}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', opacity: 0.7 }}>{t.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentRow>
      </Section>
      </section>
      </div>
    </div>
  );
}
