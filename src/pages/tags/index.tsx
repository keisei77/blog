/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import SEO from '../../components/seo';
import Layout from '../../components/layout';
import TagsComponent from '../../components/tags';

const Tags = (props: any) => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  const siteTitle = data.site.siteMetadata.title;
  return (
    <Layout location={props.location} title={siteTitle}>
      <>
        <SEO title="Keisei's Blog" />
        <TagsComponent />
      </>
    </Layout>
  );
};

export default Tags;
