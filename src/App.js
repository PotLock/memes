import {
  LivepeerConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupNeth } from "@near-wallet-selector/neth";
import { setupSender } from "@near-wallet-selector/sender";
import "App.scss";
import Big from "big.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle";
import { isValidAttribute } from "dompurify";
import "error-polyfill";
import { useAccount, useInitNear, useNear, utils } from "near-social-vm";
import React, { useCallback, useEffect, useState } from "react";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { Link, Route, BrowserRouter as Router, Switch } from "react-router-dom";
import { BosLoaderBanner } from "./components/BosLoaderBanner";
import Core from "./components/Core";
import { Camera } from "./components/custom/Camera";
import Canvas from "./components/custom/Canvas";
import { MonacoEditor } from "./components/custom/MonacoEditor";
import { LivepeerCreator } from "./components/custom/livepeer/LivepeerCreator";
import { LivepeerPlayer } from "./components/custom/livepeer/LivepeerPlayer";
import { NetworkId, Widgets } from "./data/widgets";
import { useBosLoaderInitializer } from "./hooks/useBosLoaderInitializer";
import Flags from "./pages/Flags";
import Viewer from "./pages/Viewer";

export const refreshAllowanceObj = {};
const documentationHref = "https://social.near-docs.io/";

function App(props) {
  const [connected, setConnected] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signedAccountId, setSignedAccountId] = useState(null);
  const [availableStorage, setAvailableStorage] = useState(null);
  const [walletModal, setWalletModal] = useState(null);
  const [widgetSrc, setWidgetSrc] = useState(null);

  useBosLoaderInitializer();

  const { initNear } = useInitNear();
  const near = useNear();
  const account = useAccount();
  const accountId = account.accountId;

  const location = window.location;

  const livepeerClient = createReactClient({
    provider: studioProvider({
      apiKey: "c8323290-27a8-403b-858d-8baee19925c1",
    }),
  });

  useEffect(() => {
    initNear &&
      initNear({
        networkId: NetworkId,
        selector: setupWalletSelector({
          network: NetworkId,
          modules: [
            setupNearWallet(),
            setupMyNearWallet(),
            setupSender(),
            setupHereWallet(),
            setupMeteorWallet(),
            setupNeth({
              gas: "300000000000000",
              bundle: false,
            }),
          ],
        }),
        customElements: {
          Canvas: (props) => {
            return <Canvas {...props} />;
          },
          Link: (props) => {
            if (!props.to && props.href) {
              props.to = props.href;
              delete props.href;
            }
            if (props.to) {
              props.to =
                typeof props.to === "string" &&
                isValidAttribute("a", "href", props.to)
                  ? props.to
                  : "about:blank";
            }
            return <Link {...props} />;
          },
          Camera: (props) => {
            return <Camera {...props} />;
          },
          MonacoEditor: (props) => {
            return <MonacoEditor {...props} />;
          },
          LivepeerPlayer: (props) => {
            return (
              <LivepeerConfig client={livepeerClient}>
                <LivepeerPlayer {...props} />
              </LivepeerConfig>
            );
          },
          LivepeerCreator: (props) => {
            return (
              <LivepeerConfig client={livepeerClient}>
                <LivepeerCreator {...props} />
              </LivepeerConfig>
            );
          },
        },
        config: {
          defaultFinality: undefined,
        },
      });
  }, [initNear]);

  // useEffect(() => {
  //   if (
  //     !location.search.includes("?account_id") &&
  //     !location.search.includes("&account_id") &&
  //     (location.search || location.href.includes("/?#"))
  //   ) {
  //     window.history.replaceState({}, "/", "/" + location.hash);
  //   }
  // }, [location]);

  useEffect(() => {
    if (!near) {
      return;
    }
    near.selector.then((selector) => {
      setWalletModal(
        setupModal(selector, { contractId: near.config.contractName })
      );
    });
  }, [near]);

  const requestSignIn = useCallback(
    (e) => {
      e && e.preventDefault();
      walletModal.show();
      return false;
    },
    [walletModal]
  );

  const logOut = useCallback(async () => {
    if (!near) {
      return;
    }
    const wallet = await (await near.selector).wallet();
    wallet.signOut();
    near.accountId = null;
    setSignedIn(false);
    setSignedAccountId(null);
  }, [near]);

  const refreshAllowance = useCallback(async () => {
    alert(
      "You're out of access key allowance. Need sign in again to refresh it"
    );
    await logOut();
    requestSignIn();
  }, [logOut, requestSignIn]);
  refreshAllowanceObj.refreshAllowance = refreshAllowance;

  useEffect(() => {
    if (!near) {
      return;
    }
    setSignedIn(!!accountId);
    setSignedAccountId(accountId);
    setConnected(true);
  }, [near, accountId]);

  useEffect(() => {
    setAvailableStorage(
      account.storageBalance
        ? Big(account.storageBalance.available).div(utils.StorageCostPerByte)
        : Big(0)
    );
  }, [account]);

  const passProps = {
    refreshAllowance: () => refreshAllowance(),
    setWidgetSrc,
    signedAccountId,
    signedIn,
    connected,
    availableStorage,
    widgetSrc,
    logOut,
    requestSignIn,
    widgets: Widgets,
    documentationHref,
  };

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Switch>
        <Route path={"/flags"}>
          <BosLoaderBanner />
          <Flags {...passProps} />
        </Route>
        <Route path={"/:path*"}>
          <BosLoaderBanner />
          <Viewer {...passProps} />
          <Core {...passProps} />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
