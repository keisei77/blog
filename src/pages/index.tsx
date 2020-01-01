import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Articles from '../components/articles';

const BlogIndex = (props: any) => {
  const { data } = props;
  const siteTitle = data.site.siteMetadata.title;
  return (
    <Layout location={props.location} title={siteTitle}>
      <>
        <SEO title="Keisei's Blog" />
        <Articles />
      </>
    </Layout>
  );
};

export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
