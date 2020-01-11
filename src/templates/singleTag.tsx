import React from 'react';

import Layout from '../components/layout';
import Articles from '../components/articles';

const SingleTagIndex = (props: any) => {
  const { pageContext } = props;
  const { posts, tagName } = pageContext;
  return (
    <Layout>
      <>
        <h1>{tagName}</h1>
        <Articles posts={posts} />
      </>
    </Layout>
  );
};

export default SingleTagIndex;
