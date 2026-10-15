import { dashboardStorage } from '../lib/storage';
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { usePrototype } from '@dashboard/contexts/PrototypeContext';
import { Collapse } from '@dashboard/ui/Collapse';
import { ScrollArea } from '@dashboard/ui/ScrollArea';
import { AppsIcon, ChevronDownIcon as AccountChevronIcon } from '@dashboard/ui/icons';
import { AccountMenu } from '@dashboard/ui/AccountMenu';
import { installedApps } from '../data/apps';
import { unseenInviteCount, useNetworkOnboarding } from '../pages/network/networkInvites';
import { syncPrototypeSidebarParam } from '../prototype/prototypeSidebarState';
import { HOME_INPUT_OPTIONS, useBlurpleLilacFocus, useBlurplePersistTrace, useBlurpleTrace, useEmphasizeGradient, useEmphasizeText, useGrowGradient, useHomeInputOption, usePersistToggleLabel, useRefreshGradient, useShowTooltip, useToggleAutoFocus, useTraceCursor, useTypeArrow } from '../prototype/useHomeInputOption';

// Controls parked out of the picker for now (Text shimmer, Dynamic type, and the
// whole Controls group). The code and state stay wired up so flipping this back
// to true restores them; the text shimmer is on by default meanwhile.
const SHOW_HIDDEN_HOME_CONTROLS = false;

// The whole prototype control dropdown (the variant/settings menu behind "More")
// is parked for now. Everything below it stays wired up — flip this to true to
// bring the menu back exactly as it was.
const SHOW_HOME_CONTROLS_MENU = false;

// ─── Icons ───────────────────────────────────────────────────────────────────

const RocketridesLogo = ({ size = 28 }: { size?: number }) => (
  <svg className="shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="24" height="24" rx="5" fill="black"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M15.5294 8C17.7188 8 19.5 9.79437 19.5 12C19.5 14.2056 17.7188 16 15.5294 16H9.47896C9.23527 16 9.03786 15.801 9.03786 15.5555C9.03786 15.31 9.23527 15.1111 9.47896 15.1111H15.5294C17.2323 15.1111 18.6177 13.7155 18.6177 12C18.6177 10.2845 17.2323 8.88888 15.5294 8.88888H5.9496C5.70591 8.88888 5.50837 8.69 5.50837 8.4445C5.50837 8.199 5.70591 8 5.9496 8H15.5294ZM14.2059 12C14.2059 12.7351 14.7996 13.3334 15.5295 13.3334C16.2592 13.3334 16.8529 12.7351 16.8529 12C16.8529 11.2649 16.2592 10.6666 15.5295 10.6666C14.7996 10.6666 14.2059 11.2649 14.2059 12ZM17.7353 12C17.7353 13.2254 16.7457 14.2222 15.5295 14.2222C14.3131 14.2222 13.3236 13.2254 13.3236 12C13.3236 10.7746 14.3131 9.77775 15.5295 9.77775C16.7457 9.77775 17.7353 10.7746 17.7353 12ZM12.5042 10.6667H7.96643C7.72273 10.6667 7.5252 10.4677 7.5252 10.2222C7.5252 9.97669 7.72273 9.77781 7.96643 9.77781H12.5042C12.7479 9.77781 12.9454 9.97669 12.9454 10.2222C12.9454 10.4677 12.7479 10.6667 12.5042 10.6667ZM10.7395 12.4445H6.20168C5.95798 12.4445 5.76044 12.2456 5.76044 12C5.76044 11.7545 5.95798 11.5556 6.20168 11.5556H10.7395C10.9832 11.5556 11.1807 11.7545 11.1807 12C11.1807 12.2456 10.9832 12.4445 10.7395 12.4445ZM8.97483 14.2222H4.43697C4.19328 14.2222 3.99574 14.0234 3.99574 13.7778C3.99574 13.5323 4.19328 13.3334 4.43697 13.3334H8.97483C9.21852 13.3334 9.41606 13.5323 9.41606 13.7778C9.41606 14.0234 9.21852 14.2222 8.97483 14.2222Z" fill="white"/>
  </svg>
);

const SWITCHABLE_ACCOUNTS = [{ name: 'Cactus Practice' }, { name: 'Lemon Squeezy' }];

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 16C1.61929 16 0.5 14.8807 0.5 13.5V5.54791C0.5 4.89162 0.821983 4.27709 1.36158 3.90352L6.48633 0.355616C6.82081 0.124056 7.21794 0 7.62475 0H8.37525C8.78206 0 9.17919 0.124056 9.51367 0.355615L14.6384 3.90352C15.178 4.27709 15.5 4.89162 15.5 5.54791V13.5C15.5 14.8807 14.3807 16 13 16H3ZM5 14.5H3C2.44772 14.5 2 14.0523 2 13.5V5.54791C2 5.38383 2.0805 5.2302 2.21539 5.13681L7.34015 1.5889C7.42377 1.53101 7.52305 1.5 7.62475 1.5H8.37525C8.47695 1.5 8.57623 1.53101 8.65985 1.5889L13.7846 5.13681C13.9195 5.2302 14 5.38383 14 5.54791V13.5C14 14.0523 13.5523 14.5 13 14.5H11V8C11 7.44772 10.5523 7 10 7H6C5.44772 7 5 7.44772 5 8V14.5ZM6.5 14.5H9.5V8.5H6.5V14.5Z" fill="currentColor"/>
  </svg>
);

const BalancesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 2C1 1.58579 1.33579 1.25 1.75 1.25H9.25C9.66421 1.25 10 1.58579 10 2C10 2.41421 9.66421 2.75 9.25 2.75H1.75C1.33579 2.75 1 2.41421 1 2Z" fill="currentColor"/>
    <path d="M1 10C1 9.58579 1.33579 9.25 1.75 9.25H6.75C7.16421 9.25 7.5 9.58579 7.5 10C7.5 10.4142 7.16421 10.75 6.75 10.75H1.75C1.33579 10.75 1 10.4142 1 10Z" fill="currentColor"/>
    <path d="M3.25 5.25C2.83579 5.25 2.5 5.58579 2.5 6C2.5 6.41421 2.83579 6.75 3.25 6.75H10.75C11.1642 6.75 11.5 6.41421 11.5 6C11.5 5.58579 11.1642 5.25 10.75 5.25H3.25Z" fill="currentColor"/>
    <path d="M2.5 14C2.5 13.5858 2.83579 13.25 3.25 13.25H7.25C7.66421 13.25 8 13.5858 8 14C8 14.4142 7.66421 14.75 7.25 14.75H3.25C2.83579 14.75 2.5 14.4142 2.5 14Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M16 11.5C16 13.433 14.433 15 12.5 15C10.567 15 9 13.433 9 11.5C9 9.567 10.567 8 12.5 8C14.433 8 16 9.567 16 11.5ZM14.5 11.5C14.5 12.6046 13.6046 13.5 12.5 13.5C11.3954 13.5 10.5 12.6046 10.5 11.5C10.5 10.3954 11.3954 9.5 12.5 9.5C13.6046 9.5 14.5 10.3954 14.5 11.5Z" fill="currentColor"/>
  </svg>
);

const ArrowsLoopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.71445 6.69375C9.43459 6.99911 9.45526 7.47354 9.76062 7.7534C10.066 8.03327 10.5404 8.0126 10.8203 7.70724L13.7526 4.50772C14.0154 4.22102 14.0154 3.78103 13.7527 3.4943L10.8203 0.294101C10.5405 -0.0112933 10.0661 -0.0320138 9.76068 0.24782C9.45529 0.527655 9.43457 1.00208 9.7144 1.30747L11.4953 3.25101L4.60029 3.25066C2.52914 3.25056 0.850098 4.92952 0.850098 7.00066V7.06744C0.850098 7.48165 1.18588 7.81744 1.6001 7.81744C2.01431 7.81744 2.3501 7.48165 2.3501 7.06744V7.00066C2.3501 5.75798 3.35753 4.7506 4.60021 4.75066L11.495 4.75101L9.71445 6.69375Z" fill="currentColor"/>
    <path d="M6.28588 9.30753C6.56571 9.00213 6.54499 8.52771 6.2396 8.24788C5.9342 7.96804 5.45978 7.98876 5.17994 8.29416L2.24759 11.4944C1.98486 11.7811 1.98488 12.2211 2.24762 12.5078L5.17998 15.7076C5.45983 16.0129 5.93425 16.0336 6.23963 15.7538C6.54501 15.4739 6.5657 14.9995 6.28584 14.6941L4.50542 12.7513H11.4C13.4711 12.7513 15.15 11.0724 15.15 9.00131V8.93438C15.15 8.52017 14.8142 8.18438 14.4 8.18438C13.9858 8.18438 13.65 8.52017 13.65 8.93438V9.00131C13.65 10.2439 12.6427 11.2513 11.4 11.2513H4.50478L6.28588 9.30753Z" fill="currentColor"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M2.5 14.4H13.5C13.7209 14.4 13.9 14.2209 13.9 14C13.9 12.1222 12.3778 10.6 10.5 10.6H5.5C3.62223 10.6 2.1 12.1222 2.1 14C2.1 14.2209 2.27909 14.4 2.5 14.4ZM2.5 16H13.5C14.6046 16 15.5 15.1046 15.5 14C15.5 11.2386 13.2614 9 10.5 9H5.5C2.73858 9 0.5 11.2386 0.5 14C0.5 15.1046 1.39543 16 2.5 16Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 6.4C9.32548 6.4 10.4 5.32548 10.4 4C10.4 2.67452 9.32548 1.6 8 1.6C6.67452 1.6 5.6 2.67452 5.6 4C5.6 5.32548 6.67452 6.4 8 6.4ZM8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
  </svg>
);

const ProductCatalogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.97311 0C7.66262 0 7.3564 0.0722903 7.07869 0.211146L1.60655 2.94721C0.928981 3.286 0.500977 3.97852 0.500977 4.73607V11.3054C0.500977 12.0412 0.904957 12.7175 1.55278 13.0664L6.33503 15.6414C6.77216 15.8768 7.26086 16 7.75733 16H8.24452C8.74105 16 9.22982 15.8768 9.66699 15.6413L14.4483 13.0664C15.096 12.7175 15.4999 12.0412 15.4999 11.3055V4.73599C15.4999 3.97848 15.072 3.28599 14.3945 2.94718L8.92331 0.211199C8.64557 0.0723089 8.33931 0 8.02878 0H7.97311ZM13.9999 11.3055V5.62105L8.7499 8.44799V14.4123C8.82049 14.387 8.88932 14.3564 8.95576 14.3207L13.737 11.7457C13.899 11.6585 13.9999 11.4894 13.9999 11.3055ZM8.25241 1.5528L13.5093 4.18162L11.4495 5.29075L6.06848 2.3933L7.74951 1.55279C7.81893 1.51807 7.89549 1.5 7.97311 1.5H8.02878C8.10641 1.5 8.18298 1.51808 8.25241 1.5528ZM4.75605 3.04951L2.49116 4.18196L7.9999 7.14821L10.1839 5.9722L4.75605 3.04951ZM7.2499 8.44799L2.00098 5.62165V11.3054C2.00098 11.4894 2.10197 11.6584 2.26393 11.7456L7.04618 14.3207C7.11195 14.3561 7.18006 14.3865 7.2499 14.4116V8.44799Z" fill="currentColor"/>
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 3.5C8.41421 3.5 8.75 3.83579 8.75 4.25V7.59835L10.9571 9.21913C11.2839 9.46265 11.3509 9.93353 11.1074 10.2603C10.8638 10.5871 10.393 10.6541 10.0662 10.4106L7.5546 8.5547C7.35601 8.4066 7.25 8.2099 7.25 8V4.25C7.25 3.83579 7.58579 3.5 8 3.5Z" fill="currentColor"/>
  </svg>
);

// Sail "bank" icon.
const TreasuryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.67394 0.0745863C7.87994 -0.0248621 8.12006 -0.0248621 8.32606 0.0745863L15.4347 3.50637C15.7804 3.67321 16 4.02314 16 4.40692V6C16 6.55228 15.5523 7 15 7H13.5V11.7865L15.4472 12.7601C15.786 12.9295 16 13.2757 16 13.6545V15C16 15.5523 15.5523 16 15 16H1C0.447715 16 0 15.5523 0 15V13.6553C0 13.2749 0.215857 12.9274 0.5569 12.7588L2.52673 11.7852L2.50361 7H1C0.447715 7 0 6.55228 0 6V4.40692C0 4.02314 0.219636 3.67321 0.565251 3.50637L7.67394 0.0745863ZM12 12.25V7H10.5V12.25C10.5 12.6642 10.1642 13 9.74996 13C9.33574 13 8.99996 12.6642 8.99996 12.25V7H7V12.25C7 12.6642 6.66421 13 6.25 13C5.83579 13 5.5 12.6642 5.5 12.25V7H4.00363L4.02897 12.2464C4.03036 12.533 3.86826 12.7954 3.61131 12.9224L1.5 13.9659V14.5H14.5V13.9635L12.4146 12.9208C12.1605 12.7938 12 12.5341 12 12.25ZM14.5 5.5V4.72075L8 1.58282L1.5 4.72075V5.5H14.5Z" fill="currentColor"/>
  </svg>
);

const ConnectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 6C0 5.6898 0.162753 5.40235 0.428746 5.24275L7.07125 1.25725C7.3518 1.08892 7.67283 1 8 1C8.32717 1 8.6482 1.08892 8.92875 1.25725L15.5713 5.24275C15.8372 5.40235 16 5.6898 16 6C16 6.3102 15.8372 6.59765 15.5713 6.75725L8.92875 10.7428C8.6482 10.9111 8.32717 11 8 11C7.67283 11 7.3518 10.9111 7.07125 10.7428L0.428746 6.75725C0.162753 6.59765 0 6.3102 0 6ZM7.89445 9.37076L2.27651 6L7.89445 2.62924C7.92633 2.61011 7.96282 2.6 8 2.6C8.03718 2.6 8.07367 2.61011 8.10555 2.62924L13.7235 6L8.10555 9.37076C8.07367 9.38989 8.03718 9.4 8 9.4C7.96281 9.4 7.92633 9.38989 7.89445 9.37076Z" fill="currentColor"/>
    <path d="M1.43422 9.82811C1.06312 9.58833 0.5679 9.69478 0.328114 10.0659C0.0883268 10.437 0.194776 10.9322 0.565875 11.172L6.69425 15.1319C7.06621 15.3722 7.49965 15.5 7.9425 15.5H8.0576C8.50045 15.5 8.93388 15.3722 9.30584 15.1319L15.4342 11.172C15.8053 10.9322 15.9118 10.437 15.672 10.0659C15.4322 9.69478 14.937 9.58833 14.5659 9.82811L8.4375 13.788C8.32429 13.8611 8.19238 13.9 8.0576 13.9H7.9425C7.80772 13.9 7.6758 13.8611 7.5626 13.788L1.43422 9.82811Z" fill="currentColor"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 3.88431C0 3.08377 0.545006 2.40837 1.3057 2.20462L1.32368 2.19981L10.5518 0.212648C10.7019 0.175079 10.8523 0.157617 11 0.158478C11.927 0.163877 12.75 0.890772 12.75 1.89811V4.5H13.5C14.8807 4.5 16 5.61929 16 7V13.5C16 14.8807 14.8807 16 13.5 16H2.5C1.11929 16 0 14.8807 0 13.5V3.88431ZM10.9127 1.6686C11.1118 1.61666 11.25 1.75884 11.25 1.89811V4.5H2.5C2.14445 4.5 1.80623 4.57422 1.5 4.70802V3.88431C1.5 3.79247 1.5588 3.69527 1.68102 3.65725L10.8971 1.67268L10.9127 1.6686ZM1.5 7V13.5C1.5 14.0523 1.94772 14.5 2.5 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V7C14.5 6.44772 14.0523 6 13.5 6H2.5C1.94772 6 1.5 6.44772 1.5 7Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M13 10.25C13 10.9375 12.4375 11.5 11.75 11.5C11.0625 11.5 10.5 10.95 10.5 10.25C10.5 9.56248 11.0625 8.99998 11.75 8.99998C12.4375 8.99998 13 9.56248 13 10.25Z" fill="currentColor"/>
  </svg>
);

const BillingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 2.25C0 1.00736 1.00736 0 2.25 0H9.75C10.9926 0 12 1.00736 12 2.25V8.25C12 8.66421 11.6642 9 11.25 9C10.8358 9 10.5 8.66421 10.5 8.25V2.25C10.5 1.83579 10.1642 1.5 9.75 1.5H2.25C1.83579 1.5 1.5 1.83579 1.5 2.25V13.1014C1.5 13.2223 1.61065 13.313 1.72926 13.2893C1.74596 13.286 1.76215 13.2804 1.77738 13.2728L2.66459 12.8292C3.03507 12.6439 3.48558 12.7941 3.67082 13.1646C3.85606 13.5351 3.70589 13.9856 3.33541 14.1708L2.4482 14.6144C2.31372 14.6817 2.17087 14.7307 2.02343 14.7602C0.97664 14.9695 0 14.1689 0 13.1014V2.25Z" fill="currentColor"/>
    <path d="M5 10.7C5 10.3134 5.3134 10 5.7 10H10.3C10.6866 10 11 10.3134 11 10.7C11 11.0866 10.6866 11.4 10.3 11.4H7.36027C7.40616 11.4798 7.45151 11.559 7.49623 11.6371C7.5938 11.8075 7.68863 11.9731 7.77963 12.128C8.06332 12.611 8.3341 13.0348 8.63514 13.3906C9.20669 14.066 9.88376 14.5 11.0001 14.5C12.1809 14.5 13.0379 14.0768 13.6044 13.461C14.1799 12.8354 14.5001 11.9617 14.5001 11C14.5001 10.0108 14.0807 9.43294 13.6926 9.00173C13.4155 8.69385 13.4405 8.21963 13.7484 7.94254C14.0563 7.66544 14.5305 7.6904 14.8076 7.99828C15.3195 8.56708 16.0001 9.48923 16.0001 11C16.0001 12.2883 15.5703 13.5396 14.7083 14.4765C13.8373 15.4232 12.5693 16 11.0001 16C9.36644 16 8.29351 15.309 7.49006 14.3595C7.1036 13.9027 6.78063 13.389 6.4862 12.8876C6.45706 12.838 6.42836 12.7888 6.4 12.74V15.3C6.4 15.6866 6.0866 16 5.7 16C5.3134 16 5 15.6866 5 15.3V10.7Z" fill="currentColor"/>
    <path d="M2.94995 4.25C2.94995 3.83579 3.28574 3.5 3.69995 3.5H5.69976C6.11397 3.5 6.44976 3.83579 6.44976 4.25C6.44976 4.66421 6.11397 5 5.69976 5H3.69995C3.28574 5 2.94995 4.66421 2.94995 4.25Z" fill="currentColor"/>
    <path d="M3.69995 6.5C3.28574 6.5 2.94995 6.83579 2.94995 7.25C2.94995 7.66421 3.28574 8 3.69995 8H8.29976C8.71397 8 9.04976 7.66421 9.04976 7.25C9.04976 6.83579 8.71397 6.5 8.29976 6.5H3.69995Z" fill="currentColor"/>
  </svg>
);

const ReportingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 1C1.08579 1 0.75 1.33579 0.75 1.75V12.25C0.75 13.2165 1.5335 14 2.5 14H14.5C14.9142 14 15.25 13.6642 15.25 13.25C15.25 12.8358 14.9142 12.5 14.5 12.5H2.5C2.36193 12.5 2.25 12.3881 2.25 12.25V1.75C2.25 1.33579 1.91421 1 1.5 1Z" fill="currentColor"/>
    <path d="M5 5.5C5.41421 5.5 5.75 5.83579 5.75 6.25V10.25C5.75 10.6642 5.41421 11 5 11C4.58579 11 4.25 10.6642 4.25 10.25V6.25C4.25 5.83579 4.58579 5.5 5 5.5Z" fill="currentColor"/>
    <path d="M8.75 3.25C8.75 2.83579 8.41421 2.5 8 2.5C7.58579 2.5 7.25 2.83579 7.25 3.25V10.25C7.25 10.6642 7.58579 11 8 11C8.41421 11 8.75 10.6642 8.75 10.25V3.25Z" fill="currentColor"/>
    <path d="M11 7.5C11.4142 7.5 11.75 7.83579 11.75 8.25V10.25C11.75 10.6642 11.4142 11 11 11C10.5858 11 10.25 10.6642 10.25 10.25V8.25C10.25 7.83579 10.5858 7.5 11 7.5Z" fill="currentColor"/>
  </svg>
);

const MoreDotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5Z" fill="currentColor"/>
    <path d="M13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z" fill="currentColor"/>
    <path d="M2.5 9.5C3.32843 9.5 4 8.82843 4 8C4 7.17157 3.32843 6.5 2.5 6.5C1.67157 6.5 1 7.17157 1 8C1 8.82843 1.67157 9.5 2.5 9.5Z" fill="currentColor"/>
  </svg>
);

const LabIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M1 12.6409C1 12.2241 1.13025 11.8177 1.37253 11.4785L5.5 5.7V1.5H5.24512C4.8309 1.5 4.49512 1.16421 4.49512 0.75C4.49512 0.335786 4.8309 0 5.24512 0H10.7496C11.1638 0 11.4996 0.335786 11.4996 0.75C11.4996 1.16421 11.1638 1.5 10.7496 1.5H10.5V5.7L14.6275 11.4785C14.8698 11.8177 15 12.2241 15 12.6409V13C15 14.6569 13.6569 16 12 16H4C2.34315 16 1 14.6569 1 13V12.6409ZM9 1.5H7V5.7C7 6.01263 6.90232 6.31746 6.7206 6.57186L5.7005 8H7.88C8.22518 8 8.505 8.27982 8.505 8.625C8.505 8.97018 8.22518 9.25 7.88 9.25H4.80764L3.55764 11H7.38C7.72518 11 8.005 11.2798 8.005 11.625C8.005 11.9702 7.72518 12.25 7.38 12.25H2.66478L2.59313 12.3503C2.53256 12.4351 2.5 12.5367 2.5 12.6409V13C2.5 13.8284 3.17157 14.5 4 14.5H12C12.8284 14.5 13.5 13.8284 13.5 13V12.6409C13.5 12.5367 13.4674 12.4351 13.4069 12.3503L9.2794 6.57186C9.09768 6.31746 9 6.01263 9 5.7V1.5Z" fill="currentColor"/>
  </svg>
);

// New Stripe network invites on the Network item: a count badge beside the
// label, or a dot on the icon when the sidebar is collapsed (labels hidden).
const NetworkInviteBadge = ({ count }: { count: number }) => (
  <span
    className="relative shrink-0"
    aria-label={`${count} new ${count === 1 ? 'invite' : 'invites'}`}
    style={{
      zIndex: 1,
      minWidth: 16,
      height: 16,
      padding: '0 5px',
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#675DFF',
      color: '#FFFFFF',
      fontSize: 11,
      lineHeight: '16px',
      fontWeight: 600,
      letterSpacing: 0,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {count}
  </span>
);

const IconWithDot = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <span className="relative inline-flex">
    {children}
    <span
      role="img"
      aria-label={label}
      style={{ position: 'absolute', top: -1, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#675DFF', boxShadow: '0 0 0 1.5px #FFFFFF' }}
    />
  </span>
);

// Unbuilt products listed under "More", in Dashboard order. The component
// library is appended after these.
const MORE_PRODUCTS = ['Link', 'Profiles', 'Tax', 'Identity', 'Issuing', 'Financial Connections', 'Capital', 'Climate', 'Payouts', 'Workflows', 'Projects', 'Custom objects'];
const moreProductHref = (label: string) => `/${label.toLowerCase().replaceAll(' ', '-')}`;
const matchesPath = (pathname: string, path: string) => pathname === path || pathname.startsWith(path + '/');
const isMorePath = (pathname: string) => matchesPath(pathname, '/components') || MORE_PRODUCTS.some(label => matchesPath(pathname, moreProductHref(label)));
const MORE_EXPANDED_KEY = 'dash-sidebar-more-expanded';

// Sub-items under each Products section, in Dashboard order. `lab` marks previews.
type ProductSubItem = { label: string; href: string; activePath?: string; lab?: boolean };
const PRODUCT_SECTIONS: Record<'treasury' | 'connect' | 'payments' | 'billing' | 'reporting', ProductSubItem[]> = {
  treasury: [
    { label: 'Financial accounts', href: '/treasury/financial-accounts' },
  ],
  connect: [
    { label: 'Growth', href: '/connect/growth' },
    { label: 'Enablement', href: '/connect/enablement' },
    { label: 'Connected accounts', href: '/connect/accounts' },
    { label: 'Compliance', href: '/connect/compliance' },
    { label: 'Tax forms', href: '/connect/tax-forms' },
    { label: 'Overview', href: '/connect/overview' },
    { label: 'Capital', href: '/connect/capital' },
    { label: 'Issuing', href: '/connect/issuing' },
    { label: 'Support cases', href: '/connect/support-cases' },
  ],
  payments: [
    { label: 'Analytics', href: '/payments/analytics' },
    { label: 'Managed Payments', href: '/payments/managed-payments' },
    { label: 'Checkout', href: '/checkout', lab: true },
    { label: 'Orchestration', href: '/payments/orchestration' },
    { label: 'Disputes', href: '/disputes' },
    { label: 'Radar', href: '/radar' },
    { label: 'Terminal', href: '/terminal' },
    { label: 'Agentic commerce', href: '/payments/agentic-commerce' },
  ],
  billing: [
    { label: 'Overview', href: '/billing/overview' },
    { label: 'Subscriptions', href: '/subscriptions' },
    { label: 'Invoices', href: '/invoices/all-invoices', activePath: '/invoices' },
    { label: 'Usage-based', href: '/usage-based-billing' },
    { label: 'Revenue recovery', href: '/billing/revenue-recovery' },
    { label: 'Retention', href: '/billing/retention', lab: true },
  ],
  reporting: [
    { label: 'Reports', href: '/reports' },
    { label: 'Custom metrics', href: '/reporting/custom-metrics' },
    { label: 'Sigma', href: '/sigma' },
    { label: 'Revenue Recognition', href: '/revenue-recognition' },
    { label: 'Data management', href: '/reporting/data-management' },
    { label: 'Marketing', href: '/reporting/marketing', lab: true },
  ],
};
type ProductSection = keyof typeof PRODUCT_SECTIONS;

const RECENT_PRODUCTS_KEY = 'sidebar-recent-products';
const RECENT_PRODUCTS_LIMIT = 5;
// Reuse the navigation destinations so shortcuts cannot drift from Products.
const SHORTCUT_DESTINATIONS: ProductSubItem[] = [
  ...Object.entries(PRODUCT_SECTIONS).flatMap(([section, items]) => items.map(item => ({
    ...item,
    label: item.label === 'Overview' || (section === 'connect' && ['Capital', 'Issuing'].includes(item.label))
      ? `${section[0].toUpperCase()}${section.slice(1)} ${item.label.toLowerCase()}`
      : item.label,
  }))),
  { label: 'Apps overview', href: '/apps/discover', activePath: '/apps' },
  { label: 'Installed apps', href: '/apps/installed' },
  ...installedApps.map(app => ({ label: app.name, href: `/apps/installed/${app.id}` })),
  ...MORE_PRODUCTS.map(label => ({ label, href: moreProductHref(label) })),
  { label: 'Component library', href: '/components' },
];

// Seed a varied starting list; saved visits always take precedence.
const INITIAL_SHORTCUTS = ['/subscriptions', '/radar', '/reports', '/terminal', '/invoices/all-invoices'];

function readRecentProducts(): ProductSubItem[] {
  let saved: unknown = [];
  try { saved = JSON.parse(dashboardStorage.getItem(RECENT_PRODUCTS_KEY) ?? '[]'); } catch { /* Use the seed. */ }
  return [...new Set([...(Array.isArray(saved) ? saved : []), ...INITIAL_SHORTCUTS])].flatMap(href => {
    const item = SHORTCUT_DESTINATIONS.find(item => item.href === href);
    return item ? [item] : [];
  }).slice(0, RECENT_PRODUCTS_LIMIT);
}


const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DevelopersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M13 2.5H3C2.17157 2.5 1.5 3.17157 1.5 4V12C1.5 12.8284 2.17157 13.5 3 13.5H13C13.8284 13.5 14.5 12.8284 14.5 12V4C14.5 3.17157 13.8284 2.5 13 2.5ZM3 1C1.34315 1 0 2.34315 0 4V12C0 13.6569 1.34315 15 3 15H13C14.6569 15 16 13.6569 16 12V4C16 2.34315 14.6569 1 13 1H3Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M3.43056 4.51191C3.70012 4.19741 4.1736 4.16099 4.48809 4.43056L7.98809 7.43056C8.15433 7.57304 8.25 7.78106 8.25 8C8.25 8.21894 8.15433 8.42696 7.98809 8.56944L4.48809 11.5694C4.1736 11.839 3.70012 11.8026 3.43056 11.4881C3.16099 11.1736 3.19741 10.7001 3.51191 10.4306L6.34756 8L3.51191 5.56944C3.19741 5.29988 3.16099 4.8264 3.43056 4.51191Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 10.75C8 10.3358 8.33579 10 8.75 10H12.25C12.6642 10 13 10.3358 13 10.75C13 11.1642 12.6642 11.5 12.25 11.5H8.75C8.33579 11.5 8 11.1642 8 10.75Z" fill="currentColor"/>
  </svg>
);

function ConsoleSwitcherIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#dashboard_console_switcher_clip)">
        <path d="M4.01562 5.58594C4.01562 6.76868 4.01562 8.36941 4.01562 9.39124C4.01562 9.94353 4.46334 10.3906 5.01562 10.3906H14.2656C14.8179 10.3906 15.2656 9.94291 15.2656 9.39062V1.78125C15.2656 1.22897 14.8179 0.78125 14.2656 0.78125H5.01563C4.46334 0.78125 4.01562 1.22897 4.01562 1.78125V3.18359" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10.0156 5.58594L1.76563 5.58594C1.21334 5.58594 0.765626 6.03365 0.765626 6.58594L0.765625 14.1953C0.765625 14.7476 1.21334 15.1953 1.76562 15.1953L11.0156 15.1953C11.5679 15.1953 12.0156 14.7476 12.0156 14.1953L12.0156 12.793" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.00003 7.31155L10.7256 5.58594L9.00003 3.86032" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="dashboard_console_switcher_clip"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

// ─── Nav primitives ───────────────────────────────────────────────────────────

interface NavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  expandable?: boolean;
  accessory?: React.ReactNode;
  rowHeight?: number;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, isActive, expandable, expanded, accessory, rowHeight, v2, collapsed, onClick }: NavItemProps & { v2?: boolean; expanded?: boolean; collapsed?: boolean }) => {
  const rowH = rowHeight ? '' : v2 ? 'h-[36px]' : 'h-[30px]';
  const hoverable = !!href || !!onClick;
  const activeColor = v2 ? '#3730A3' : '#533AFD';
  const activeBgColor = v2 ? '#EEF2FF' : '#F7F5FD';
  const bgRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' as const });
  const [tooltipRow, setTooltipRow] = useState<HTMLElement | null>(null);
  const pathname = usePathname();

  const hideTooltip = useCallback(() => {
    if (bgRef.current) bgRef.current.style.background = 'transparent';
    setTooltipRow(null);
    setTooltipStyle(s => (s.opacity === 0 ? s : { ...s, opacity: 0 }));
  }, []);

  // mouseleave alone can be missed when the row moves under a still cursor
  // (e.g. the sidebar collapsing on navigation), so also hide on any pointer
  // move outside the row, any click or scroll, and route/collapse changes.
  useEffect(() => {
    if (!tooltipRow) return;
    const onMove = (e: PointerEvent) => {
      if (!tooltipRow.contains(e.target as Node)) hideTooltip();
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerdown', hideTooltip, true);
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('blur', hideTooltip);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', hideTooltip, true);
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('blur', hideTooltip);
    };
  }, [tooltipRow, hideTooltip]);

  const [tooltipKey, setTooltipKey] = useState({ pathname, collapsed });
  if (tooltipKey.pathname !== pathname || tooltipKey.collapsed !== collapsed) {
    setTooltipKey({ pathname, collapsed });
    if (tooltipRow) hideTooltip();
  }

  const hoverBg = isActive ? activeBgColor : '#F5F6F8';
  const onEnter = hoverable ? (e: React.MouseEvent) => {
    if (bgRef.current) bgRef.current.style.background = hoverBg;
    const row = e.currentTarget as HTMLElement;
    if (collapsed && row.matches(':hover')) {
      setTooltipRow(row);
      const rect = row.getBoundingClientRect();
      const navEl = (e.currentTarget as HTMLElement).closest('.dash-sidebar-nav');
      const navRight = navEl ? navEl.getBoundingClientRect().right : rect.right;
      const tooltipOffsetX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--prototype-collapse-tooltip-offset-x')) || 0;
      setTooltipStyle({
        position: 'fixed',
        left: navRight + tooltipOffsetX,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
        background: '#1A2C44',
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        fontFamily: "'SF Pro Text', system-ui, sans-serif",
        zIndex: 9999,
        opacity: 1,
        pointerEvents: 'none' as const,
        transition: 'opacity 150ms ease',
      });
    }
  } : undefined;
  const onLeave = hoverable ? () => {
    if (bgRef.current) bgRef.current.style.background = 'transparent';
    hideTooltip();
  } : undefined;

  const inner = (
    <>
      <div
        ref={bgRef}
        className="absolute rounded-md"
        style={{
          inset: '-1px -4px',
          background: 'transparent',
          transition: 'background 120ms ease',
          zIndex: 0,
        }}
      />
      <div className="flex items-center justify-center w-[24px] h-[24px] shrink-0 relative" style={{ color: isActive ? activeColor : '#6C7688', zIndex: 1 }}>
        {icon}
      </div>
      {!collapsed && accessory ? (
        <div className="flex items-center gap-2 min-w-0 relative" style={{ zIndex: 1 }}>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontWeight: isActive ? 600 : 400, color: isActive ? activeColor : '#1A2C44' }}>
            {label}
          </span>
          {accessory}
        </div>
      ) : !collapsed && (
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap relative" style={{ fontWeight: isActive ? 600 : 400, color: isActive ? activeColor : '#1A2C44', zIndex: 1 }}>
          {label}
        </span>
      )}
      {!collapsed && expandable && (
        <div className="shrink-0 relative" style={{ color: '#9AA3B0', marginRight: 4, transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 150ms', zIndex: 1 }}>
          <ChevronDownIcon />
        </div>
      )}
    </>
  );

  const cls = `dui-console-icon-trigger relative flex items-center gap-2 ${rowH} text-[14px] leading-5`;
  const itemStyle = {
    cursor: href || onClick ? 'pointer' : 'default',
    letterSpacing: '-0.15px',
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'left' as const,
    font: 'inherit',
    ...(rowHeight ? { height: rowHeight } : {}),
  };

  if (!href) {
    return (
      <div
        className={cls}
        style={itemStyle}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        } : undefined}
      >
        {inner}
        {collapsed && onClick && createPortal(<div style={tooltipStyle}>{label}</div>, document.body)}
      </div>
    );
  }

  return (
    <Link href={href} className={cls} style={itemStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {inner}
      {collapsed && createPortal(<div style={tooltipStyle}>{label}</div>, document.body)}
    </Link>
  );
};

const MenuGroupHeader = ({ label }: { label: string }) => (
  <div className="dash-more-dropdown__row dash-more-dropdown__row--group">
    <span className="dash-more-dropdown__group-title">{label}</span>
  </div>
);

const MenuSwitchItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className="dash-more-dropdown__row dash-more-dropdown__row--switch"
    onClick={() => onChange(!checked)}
  >
    <span className="dash-more-dropdown__subtitle">{label}</span>
    <span className={`dash-switch dash-switch--sm${checked ? ' dash-switch--on' : ''}`} aria-hidden="true">
      <span className="dash-switch__thumb" />
    </span>
  </button>
);

const SubNavItem = ({ href, label, isActive, v2, onClick, indent = true, accessory }: { href?: string; label: string; isActive?: boolean; v2?: boolean; onClick?: () => void; indent?: boolean; accessory?: React.ReactNode }) => {
  const isMenu = !indent;
  const rowH = isMenu ? 'h-[40px]' : v2 ? 'h-[36px]' : 'h-[30px]';
  const activeColor = v2 ? '#3730A3' : '#533AFD';
  const activeBg = v2 ? '#EEF2FF' : '#F7F5FD';
  const hoverable = !!href || !!onClick;
  const bgRef = useRef<HTMLDivElement>(null);
  const restBg = isMenu ? 'transparent' : (isActive ? activeBg : 'transparent');
  const hoverBg = isMenu || !isActive ? '#F5F6F8' : activeBg;
  const onEnter = hoverable ? () => {
    if (bgRef.current) bgRef.current.style.background = hoverBg;
  } : undefined;
  const onLeave = hoverable ? () => {
    if (bgRef.current) bgRef.current.style.background = restBg;
  } : undefined;
  const inner = (
    <div className="relative flex items-center w-full h-full min-w-0" style={{ paddingLeft: indent ? 32 : 12, paddingRight: indent ? 0 : 12 }}>
      <div
        ref={bgRef}
        className="absolute rounded-md"
        style={{
          inset: indent ? '-1px -4px' : 0,
          background: restBg,
          transition: 'background 120ms ease',
          zIndex: 0,
        }}
      />
      <span className="relative min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" title={label} style={{ zIndex: 1, fontSize: 14, lineHeight: '20px', letterSpacing: '-0.15px', fontWeight: isActive ? 600 : 400, color: isActive ? activeColor : '#1A2C44' }}>
        {label}
      </span>
      {accessory && (
        <span className="relative inline-flex items-center" style={{ zIndex: 1, marginLeft: 6, color: '#6C7688' }}>
          {accessory}
        </span>
      )}
    </div>
  );

  const cls = `${rowH} flex items-center w-full`;
  const itemStyle = {
    cursor: href || onClick ? 'pointer' : 'default',
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'left' as const,
    font: 'inherit',
  };

  if (!href) {
    return (
      <div
        className={cls}
        style={itemStyle}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={cls} style={{ cursor: 'pointer' }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {inner}
    </Link>
  );
};

const SectionHeading = ({ label, collapsed }: { label: string; collapsed?: boolean }) => {
  if (collapsed) return <div style={{ height: 8 }} />;
  return (
    <div className="flex items-center h-[26px] text-[12px] leading-5 text-[#596171]">
      {label}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = ({ width }: { width: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, flexShrink: 0 }}>
    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: 4, background: '#F4F7FA' }} />
    </div>
    <div style={{ width, height: 14, borderRadius: 4, background: '#F4F7FA' }} />
  </div>
);

const NavSkeleton = () => (
  <div style={{ flex: 1, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <SkeletonRow width={44} />
      <SkeletonRow width={69} />
      <SkeletonRow width={44} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <SkeletonRow width={69} />
      <SkeletonRow width={44} />
    </div>
  </div>
);

// ─── DashboardSidebar ──────────────────────────────────────────────────────────────────

const CONSOLE_MIN_W = 200;
const CONSOLE_MAX_W = 520;

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

export default function DashboardSidebar({
  collapsed = false,
  collapsedWidth = SIDEBAR_COLLAPSED,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  collapsedWidth?: number;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const currentProduct = SHORTCUT_DESTINATIONS
    .filter(item => matchesPath(pathname, item.activePath ?? item.href))
    .sort((a, b) => (b.activePath ?? b.href).length - (a.activePath ?? a.href).length)[0];
  const { navVisible, version, v2ConsoleOpen, setV2ConsoleOpen } = usePrototype();
  const newNetworkInvites = unseenInviteCount(useNetworkOnboarding());
  const [consolePanelWidth, setConsolePanelWidth] = useState(240);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const closeAccountMenu = useCallback(() => setAccountMenuOpen(false), []);
  const [moreExpanded, setMoreExpanded] = useState(() => {
    try { return dashboardStorage.getItem(MORE_EXPANDED_KEY) === 'true'; } catch { return false; }
  });
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [recentProducts, setRecentProducts] = useState(readRecentProducts);
  const [openSections, setOpenSections] = useState<Record<ProductSection, boolean>>(() => ({
    treasury: false,
    connect: false,
    payments: false,
    billing: false,
    reporting: false,
  }));
  const [moreMenuPos, setMoreMenuPos] = useState({ top: 0, left: 0, width: 220, maxHeight: 0, up: false });
  const [homeInputOption, setHomeInputOption] = useHomeInputOption();
  const [persistToggleLabel, setPersistToggleLabel] = usePersistToggleLabel();
  const [toggleAutoFocus, setToggleAutoFocus] = useToggleAutoFocus();
  const [toggleTooltip, setToggleTooltip] = useShowTooltip('toggle');
  const [shortcutTooltip, setShortcutTooltip] = useShowTooltip('shortcut');
  const [toggleBlurpleLilacFocus, setToggleBlurpleLilacFocus] = useBlurpleLilacFocus('toggle');
  const [shortcutBlurpleLilacFocus, setShortcutBlurpleLilacFocus] = useBlurpleLilacFocus('shortcut');
  const [toggleRefreshGradient, setToggleRefreshGradient] = useRefreshGradient('toggle');
  const [shortcutRefreshGradient, setShortcutRefreshGradient] = useRefreshGradient('shortcut');
  const [shortcutTypeArrow, setShortcutTypeArrow] = useTypeArrow('shortcut');
  const [shortcutEmphasizeText, setShortcutEmphasizeText] = useEmphasizeText('shortcut');
  const [shortcutEmphasizeGradient, setShortcutEmphasizeGradient] = useEmphasizeGradient('shortcut');
  const [shortcutGrowGradient, setShortcutGrowGradient] = useGrowGradient('shortcut');
  const [shortcutTraceCursor, setShortcutTraceCursor] = useTraceCursor('shortcut');
  const [shortcutBlurpleTrace, setShortcutBlurpleTrace] = useBlurpleTrace('shortcut');
  const [shortcutBlurplePersistTrace, setShortcutBlurplePersistTrace] = useBlurplePersistTrace('shortcut');
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartW = useRef(240);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (moreRef.current?.contains(target) || moreMenuRef.current?.contains(target)) return;
      setMoreOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
    // Visits update recents without changing the user's disclosure state.
    if (currentProduct) {
      setRecentProducts(items => items[0]?.href === currentProduct.href ? items : [
        currentProduct,
        ...items.filter(item => item.href !== currentProduct.href),
      ].slice(0, RECENT_PRODUCTS_LIMIT));
    }
  }, [pathname, currentProduct]);

  useEffect(() => {
    dashboardStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(recentProducts.map(item => item.href)));
  }, [recentProducts]);

  useEffect(() => {
    try { dashboardStorage.setItem(MORE_EXPANDED_KEY, String(moreExpanded)); } catch { /* storage unavailable */ }
  }, [moreExpanded]);

  // "More" sits at the bottom of the sidebar, so the menu usually has to open
  // upward. Measured after mount, since the height depends on the sub-controls.
  const placeMoreMenu = useCallback(() => {
    const trigger = moreRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gutter = 12;
    const available = window.innerHeight - gutter * 2;
    const menu = moreMenuRef.current;
    const height = Math.min(menu ? menu.scrollHeight : 0, available);

    const left = collapsed ? rect.right + 8 : rect.left;
    const width = collapsed ? 220 : Math.max(rect.width, 220);
    let top = collapsed ? rect.top : rect.bottom + 4;
    let up = false;

    if (!collapsed && top + height > window.innerHeight - gutter) {
      top = rect.top - 4 - height;
      up = true;
    }
    top = Math.max(gutter, Math.min(top, window.innerHeight - gutter - height));

    setMoreMenuPos({ top, left, width, maxHeight: available, up });
  }, [collapsed]);

  useLayoutEffect(() => {
    if (!moreOpen) return;
    placeMoreMenu();
    window.addEventListener('resize', placeMoreMenu);
    return () => window.removeEventListener('resize', placeMoreMenu);
  }, [moreOpen, placeMoreMenu]);

  const openMoreMenu = () => {
    placeMoreMenu();
    setMoreOpen(true);
  };

  // Sub-controls per home input option. Always rendered, so a variant's
  // settings are visible whether or not you're currently viewing it.
  const nestedOptions: Record<string, React.ReactNode> = {
    toggle: (
      <>
        <MenuSwitchItem
          label="Persist label"
          checked={persistToggleLabel}
          onChange={setPersistToggleLabel}
        />
        <MenuSwitchItem
          label="Auto-focus input"
          checked={toggleAutoFocus}
          onChange={setToggleAutoFocus}
        />
        <MenuSwitchItem
          label="Blurple"
          checked={toggleBlurpleLilacFocus}
          onChange={setToggleBlurpleLilacFocus}
        />
        <MenuSwitchItem
          label="Refresh gradient"
          checked={toggleRefreshGradient}
          onChange={setToggleRefreshGradient}
        />
        <MenuSwitchItem
          label="Show tooltip"
          checked={toggleTooltip}
          onChange={setToggleTooltip}
        />
      </>
    ),
    shortcut: (
      <>
        {SHOW_HIDDEN_HOME_CONTROLS && (
          <>
            <MenuGroupHeader label="Blurple styles" />
            <MenuSwitchItem
              label="Persistent gradient"
              checked={shortcutBlurpleLilacFocus}
              onChange={setShortcutBlurpleLilacFocus}
            />
            <MenuSwitchItem
              label="Trace cursor"
              checked={shortcutBlurpleTrace}
              onChange={setShortcutBlurpleTrace}
            />
            <MenuSwitchItem
              label="Persistent + trace"
              checked={shortcutBlurplePersistTrace}
              onChange={setShortcutBlurplePersistTrace}
            />
            <MenuSwitchItem
              label="Text shimmer"
              checked={shortcutEmphasizeText}
              onChange={setShortcutEmphasizeText}
            />
          </>
        )}
        <MenuGroupHeader label="Refresh styles" />
        <MenuSwitchItem
          label="Persistent gradient"
          checked={shortcutRefreshGradient}
          onChange={setShortcutRefreshGradient}
        />
        {SHOW_HIDDEN_HOME_CONTROLS && (
          <MenuSwitchItem
            label="Dynamic type"
            checked={shortcutGrowGradient}
            onChange={setShortcutGrowGradient}
          />
        )}
        <MenuSwitchItem
          label="Trace cursor"
          checked={shortcutTraceCursor}
          onChange={setShortcutTraceCursor}
        />
        {SHOW_HIDDEN_HOME_CONTROLS && (
          <MenuSwitchItem
            label="Text shimmer"
            checked={shortcutEmphasizeGradient}
            onChange={setShortcutEmphasizeGradient}
          />
        )}
        {SHOW_HIDDEN_HOME_CONTROLS && (
          <>
            <MenuGroupHeader label="Controls" />
            <MenuSwitchItem
              label="Arrow on type"
              checked={shortcutTypeArrow}
              onChange={setShortcutTypeArrow}
            />
            <MenuSwitchItem
              label="Show tooltip"
              checked={shortcutTooltip}
              onChange={setShortcutTooltip}
            />
          </>
        )}
      </>
    ),
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = consolePanelWidth;
    isDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || dragStartX.current === null) return;
      setConsolePanelWidth(Math.min(CONSOLE_MAX_W, Math.max(CONSOLE_MIN_W, dragStartW.current + (ev.clientX - dragStartX.current))));
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [consolePanelWidth]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const buildDashboardHref = (path: string) => {
    if (typeof window === 'undefined') return path;

    const params = new URLSearchParams(window.location.search);
    if (!params.get('prototypeView')) return path;

    syncPrototypeSidebarParam(params);
    const query = params.toString();
    return `${path}${query ? `?${query}` : ''}`;
  };
  const homeHref = buildDashboardHref('/');
  const consoleHref = (() => {
    if (typeof window === 'undefined') return '/console';

    const params = new URLSearchParams(window.location.search);
    syncPrototypeSidebarParam(params);
    params.delete('consoleEntry');
    params.delete('returnTo');

    const query = params.toString();
    return `/console${query ? `?${query}` : ''}`;
  })();

  const renderProductSection = (key: ProductSection, icon: React.ReactNode, label: string) => (
    <>
      <NavItem
        collapsed={collapsed}
        v2={version === 'v2'}
        icon={icon}
        label={label}
        expandable
        expanded={openSections[key]}
        isActive={PRODUCT_SECTIONS[key].some(item => isActive(item.activePath ?? item.href))}
        onClick={() => {
          setOpenSections(open => ({ ...open, [key]: collapsed ? true : !open[key] }));
          if (collapsed) onToggleCollapse?.();
        }}
      />
      {!collapsed && (
        <Collapse open={openSections[key]}>
          {PRODUCT_SECTIONS[key].map(item => (
            <SubNavItem
              key={item.label}
              v2={version === 'v2'}
              href={buildDashboardHref(item.href)}
              label={item.label}
              isActive={isActive(item.activePath ?? item.href)}
              accessory={item.lab ? <LabIcon /> : undefined}
            />
          ))}
        </Collapse>
      )}
    </>
  );

  return (
    <>
      {/* Nav sidebar */}
      {pathname !== '/invoices/draft' && (
        <div
          className="dash-sidebar-nav flex flex-col bg-white border-r shrink-0 relative"
          data-wireframe-tone-after="dark"
          data-collapsed={collapsed ? 'true' : 'false'}
          style={{
            borderColor: '#ECF1F6',
            height: '100vh',
            width: collapsed ? collapsedWidth : SIDEBAR_EXPANDED,
            transition: 'width var(--prototype-sidebar-transition-ms, 200ms) cubic-bezier(0.25, 0.1, 0.25, 1), border-color var(--prototype-sidebar-fade-ms, 150ms) ease',
          }}
        >
          {/* Account Header — V1 only. It, Network and Connect stay real on pages
              shown as wireframes (data-wireframe-default). */}
          {version !== 'v2' && (
            <div className="dash-sidebar-static-section sticky top-0 z-10 flex items-center h-[60px] bg-white" style={{ padding: '0 8px' }} data-wireframe-show="">
              <button
                ref={accountTriggerRef}
                type="button"
                className={`dash-account-trigger${accountMenuOpen ? ' dash-account-trigger--open' : ''}`}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((o) => !o)}
              >
                <RocketridesLogo />
                {!collapsed && (
                  <>
                    <span className="flex-1 min-w-0 truncate text-left text-[14px] leading-5 -tracking-[0.15px] font-semibold text-[#1A2C44]">
                      Rocketrides
                    </span>
                    <AccountChevronIcon size={10} className="dash-account-trigger__chevron" />
                  </>
                )}
              </button>
              <AccountMenu
                anchorRef={accountTriggerRef}
                open={accountMenuOpen}
                onClose={closeAccountMenu}
                account={{ name: 'Rocketrides', logo: <RocketridesLogo size={40} /> }}
                accounts={SWITCHABLE_ACCOUNTS}
                user="Kevin Yien"
              />
            </div>
          )}

          {/* Dashboard label — V2 only */}
          {version === 'v2' && (
            <div className="dash-sidebar-static-section sticky top-0 z-10 flex items-center h-[60px] bg-white border-b" style={{ borderColor: '#ECF1F6', paddingLeft: 18, paddingRight: 16 }}>
              {!collapsed && <span className="text-[16px] leading-5 font-semibold text-[#1A2C44] -tracking-[0.3px]">Dashboard</span>}
            </div>
          )}

          {/* Skeleton shown when nav is hidden */}
          {!navVisible && <NavSkeleton />}

          {/* Navigation — only visible when navVisible */}
          {navVisible && (
            <>
              <ScrollArea className="flex-1" viewportStyle={{ padding: '16px 20px' }}>
                <div className="flex flex-col gap-5">

                  {/* Main nav — no section heading */}
                  <div className="flex flex-col">
                    <NavItem collapsed={collapsed} v2={version === 'v2'} href={homeHref} icon={<HomeIcon />} label="Home" isActive={pathname === '/' || pathname === '/onsite-home'} />
                    <NavItem collapsed={collapsed} v2={version === 'v2'}
                      href={buildDashboardHref('/balances')}
                      icon={<BalancesIcon />}
                      label="Balances"
                      isActive={isActive('/balances')}
                    />
                    <NavItem collapsed={collapsed} v2={version === 'v2'}
                      href={buildDashboardHref('/transactions/payments')}
                      icon={<ArrowsLoopIcon />}
                      label="Transactions"
                      isActive={isActive('/transactions')}
                    />
                    <div data-wireframe-show="">
                    <NavItem collapsed={collapsed} v2={version === 'v2'}
                      href={buildDashboardHref('/network/all')}
                      icon={collapsed && newNetworkInvites > 0
                        ? <IconWithDot label={`${newNetworkInvites} new network ${newNetworkInvites === 1 ? 'invite' : 'invites'}`}><PersonIcon /></IconWithDot>
                        : <PersonIcon />}
                      label="Network"
                      isActive={isActive('/network')}
                      accessory={newNetworkInvites > 0 ? <NetworkInviteBadge count={newNetworkInvites} /> : undefined}
                    />
                    </div>
                    <NavItem collapsed={collapsed} v2={version === 'v2'}
                      href={buildDashboardHref('/product-catalog/all-products')}
                      icon={<ProductCatalogIcon />}
                      label="Product catalog"
                      isActive={isActive('/product-catalog')}
                    />
                  </div>

                  {/* Shortcuts — the five most recently visited product pages. */}
                  {recentProducts.length > 0 && <div className="flex flex-col">
                    <SectionHeading collapsed={collapsed} label="Shortcuts" />
                    {collapsed ? (
                      <NavItem collapsed={collapsed} v2={version === 'v2'} icon={<TerminalIcon />} label="Shortcuts" onClick={onToggleCollapse} />
                    ) : recentProducts.map(item => (
                      <NavItem
                        key={item.href}
                        v2={version === 'v2'}
                        icon={<TerminalIcon />}
                        label={item.label}
                        href={buildDashboardHref(item.href)}
                        isActive={currentProduct?.href === item.href}
                      />
                    ))}
                  </div>}

                  {/* Products */}
                  <div className="flex flex-col">
                    <SectionHeading collapsed={collapsed} label="Products" />
                    {renderProductSection('treasury', <TreasuryIcon />, 'Treasury')}
                    <div data-wireframe-show="">{renderProductSection('connect', <ConnectIcon />, 'Connect')}</div>
                    {renderProductSection('payments', <WalletIcon />, 'Payments')}
                    {renderProductSection('billing', <BillingIcon />, 'Billing')}
                    {renderProductSection('reporting', <ReportingIcon />, 'Reporting')}
                    <NavItem
                      collapsed={collapsed}
                      v2={version === 'v2'}
                      icon={<AppsIcon />}
                      label="Apps"
                      isActive={isActive('/apps')}
                      expandable
                      expanded={appsExpanded}
                      onClick={() => {
                        if (collapsed) {
                          setAppsExpanded(true);
                          onToggleCollapse?.();
                        } else {
                          setAppsExpanded(open => !open);
                        }
                      }}
                    />
                    {!collapsed && (
                      <Collapse open={appsExpanded}>
                        <SubNavItem
                          v2={version === 'v2'}
                          href={buildDashboardHref('/apps/discover')}
                          label="Overview"
                          isActive={isActive('/apps') && !isActive('/apps/installed')}
                        />
                        {installedApps.map(app => (
                          <SubNavItem
                            key={app.id}
                            v2={version === 'v2'}
                            label={app.name}
                            href={buildDashboardHref(`/apps/installed/${app.id}`)}
                            isActive={isActive(`/apps/installed/${app.id}`)}
                          />
                        ))}
                      </Collapse>
                    )}
                    <div ref={moreRef}>
                      <NavItem
                        collapsed={collapsed}
                        v2={version === 'v2'}
                        icon={<MoreDotsIcon />}
                        label="More"
                        expandable
                        expanded={moreExpanded}
                        isActive={isMorePath(pathname)}
                        onClick={() => {
                          if (collapsed) {
                            setMoreExpanded(true);
                            onToggleCollapse?.();
                          } else {
                            setMoreExpanded(open => !open);
                          }
                          if (SHOW_HOME_CONTROLS_MENU) {
                            if (moreOpen) setMoreOpen(false);
                            else openMoreMenu();
                          }
                        }}
                      />
                      {!collapsed && (
                        <Collapse open={moreExpanded}>
                          {MORE_PRODUCTS.map(product => (
                            <SubNavItem
                              key={product}
                              v2={version === 'v2'}
                              label={product}
                              href={buildDashboardHref(moreProductHref(product))}
                              isActive={isActive(moreProductHref(product))}
                              accessory={product === 'Custom objects' ? <LabIcon /> : undefined}
                            />
                          ))}
                          <SubNavItem
                            v2={version === 'v2'}
                            href={buildDashboardHref('/components')}
                            label="Component library"
                            isActive={isActive('/components')}
                          />
                        </Collapse>
                      )}
                      {SHOW_HOME_CONTROLS_MENU && moreOpen && createPortal(
                        <div
                          ref={moreMenuRef}
                          className={`dash-more-dropdown${moreMenuPos.up ? ' dash-more-dropdown--up' : ''}`}
                          style={{
                            top: moreMenuPos.top,
                            left: moreMenuPos.left,
                            width: moreMenuPos.width,
                            maxHeight: moreMenuPos.maxHeight || undefined,
                          }}
                        >
                          {/* Button and Toggle are still live variants (links,
                              saved state, the prototype all honour them) —
                              they're just hidden from the picker for now, so the
                              code stays put in case we bring them back. */}
                          {HOME_INPUT_OPTIONS.filter((option) => option.id !== 'button' && option.id !== 'toggle').map((option, index) => (
                            <div key={option.id}>
                              {index > 0 && <div className="dash-more-dropdown__divider" />}
                              <div className="dash-more-dropdown__section">
                                <div className="dash-more-dropdown__row">
                                  <button
                                    type="button"
                                    className="dash-more-dropdown__title-link"
                                    onClick={() => setHomeInputOption(option.id)}
                                  >
                                    {option.label}
                                  </button>
                                </div>
                                {nestedOptions[option.id]}
                              </div>
                            </div>
                          ))}
                        </div>,
                        document.body,
                      )}
                    </div>
                  </div>

                </div>
              </ScrollArea>
            </>
          )}

          {/* Console + Developers — pinned at the very bottom */}
          <div className="dash-sidebar-static-section mt-auto">
            <div style={{ padding: '12px 20px 14px' }}>
              <NavItem
                collapsed={collapsed}
                v2={version === 'v2'}
                href={consoleHref}
                icon={<ConsoleSwitcherIcon />}
                label="Console"
                isActive={isActive('/console')}
                rowHeight={32}
                accessory={
                  <span
                    className="relative shrink-0"
                    style={{
                      zIndex: 1,
                      height: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 10px',
                      border: '1px solid #C9D3DF',
                      borderRadius: 6,
                      color: '#526378',
                      background: '#FFFFFF',
                      fontSize: 14,
                      lineHeight: '20px',
                      fontWeight: 400,
                      letterSpacing: '-0.15px',
                      boxShadow: '0 1px 1px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    Preview
                  </span>
                }
              />
            </div>
            <Link
              href={buildDashboardHref('/developers')}
              aria-label="Developers"
              aria-current={isActive('/developers') ? 'page' : undefined}
              data-wireframe-tone="dark"
              style={{
                height: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 20px',
                borderTop: '1px solid #2B303B',
                background: '#1B1F27',
                color: '#E6EAF0',
                fontSize: 14,
                lineHeight: '20px',
                fontWeight: 400,
                letterSpacing: '-0.15px',
              }}
            >
              <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#C0C8D2' }}>
                <DevelopersIcon />
              </span>
              {!collapsed && <span>Developers</span>}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
