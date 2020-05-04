import React, { useRef, useEffect, useState, ReactElement } from 'react';
import Header from './header';
import throttle from 'lodash/throttle';
import styled from 'styled-components';
import { useStaticQuery, graphql } from 'gatsby';

interface LayoutProps {
  children: ReactElement;
}

const StyledMain = styled.main`
  margin-left: auto;
  margin-right: auto;
  padding: 4rem 1rem 0;
  min-height: calc(100% - 6.125rem);

  @media screen and (min-width: 1200px) {
    width: 65%;
  }
`;

const StyledFooter = styled.footer`
  padding: 0 1rem 1rem;
  margin-left: auto;
  margin-right: auto;

  @media screen and (min-width: 1200px) {
    width: 65%;
  }
`;

const SCROLL_OPACITY_HEIGHT = 128;

function Layout(props: LayoutProps) {
  const { children } = props;
  const [scrollRate, setScrollRate] = useState<number>(0);
  const mainRef = useRef<HTMLElement>(null);

  const throttledScroll = throttle((event: Event) => {
    const scrollTop = (event?.target as any).documentElement?.scrollTop;
    if (scrollTop) {
      setScrollRate(Math.min(1, scrollTop / SCROLL_OPACITY_HEIGHT));
    } else {
      setScrollRate(0);
    }
  }, 100);
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  const title = data.site.siteMetadata.title;

  useEffect(() => {
    if (!mainRef.current) {
      return;
    }
    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [throttledScroll]);
  return (
    <div style={{ height: '100%' }}>
      <Header scrollRate={scrollRate} title={title} />
      <StyledMain ref={mainRef}>{children}</StyledMain>
      <StyledFooter>
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.org">Gatsby</a>
      </StyledFooter>
    </div>
  );
}

export default Layout;
