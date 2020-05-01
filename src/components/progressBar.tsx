/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const StyledProgressBar = styled.progress`
  --progress-width: 100%;
  --progress-height: 4px;
  --progress-bar-color: #fcf798;
  --progress-bg: none;

  position: fixed;
  width: 100%;
  left: 0;
  z-index: 9999;
  right: 0;

  &:not([value]) {
    height: 0;
  }

  &[value] {
    /* Reset the default appearance */
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    /* Get rid of default border in Firefox. */
    border: none;

    width: var(--progress-width);
    height: var(--progress-height);

    /* Firefox: any style applied here applies to the container. */
    background-color: var(--progress-bg);

    /* For IE10 */
    color: var(--progress-bar-color);
  }

  &[value]::-moz-progress-bar {
    background-color: var(--progress-bar-color);
  }

  /* WebKit/Blink browsers:
    -webkit-progress-bar is to style the container */
  &[value]::-webkit-progress-bar {
    background-color: var(--progress-bg);
  }

  /*-webkit-progress-value is to style the progress bar.*/
  &[value]::-webkit-progress-value {
    background-color: var(--progress-bar-color);
  }
`;

const ProgressBar = () => {
  const progressRef = useRef<HTMLProgressElement>(null);
  const scrollHandler = useCallback(
    (event: Event) => {
      const postEl = document.querySelector('main');
      if (postEl && progressRef.current) {
        const postElRectInfo = postEl.getBoundingClientRect();
        const value = Math.floor(
          Math.abs(
            postElRectInfo.top / (postElRectInfo.height - window.innerHeight)
          ) * 100
        );
        progressRef.current.setAttribute('value', value.toString());
      }
    },
    [progressRef]
  );
  useEffect(() => {
    window.addEventListener('scroll', scrollHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [scrollHandler]);
  return <StyledProgressBar ref={progressRef} id="post" max="100" />;
};

export default ProgressBar;
