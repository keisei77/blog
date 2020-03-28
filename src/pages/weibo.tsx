import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-unfetch';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useEffect } from 'react';
import SEO from '../components/seo';
import Layout from '../components/layout';

interface WeiboData {
  title: string;
  lead?: string;
  feedContent: string[];
}

const Weibo = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fullData, setFullData] = useState<WeiboData[]>([]);
  const [topicsExpand, setTopicsExpand] = useState<boolean[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fecthInitialData = async () => {
      setLoading(true);
      const weiboDataResponse = await fetch(
        'https://micro-backend.herokuapp.com/api/weibo'
      );

      const weiboData = await weiboDataResponse.json();
      setLoading(false);
      setFullData(weiboData);
      setTopicsExpand(Array(weiboData.length).fill(false));
    };
    fecthInitialData();
  }, []);

  const updateTopicsExpand = useCallback(topicIndex => {
    setTopicsExpand(
      prevExpand => (
        (prevExpand[topicIndex] = !prevExpand[topicIndex]), [...prevExpand]
      )
    );
  }, []);

  const loadingMore = useCallback(async () => {
    try {
      const nextPageData = await fetch(
        `https://micro-backend.herokuapp.com/api/weibo?page=${currentPage + 1}`
      );
      const nextData = await nextPageData.json();

      ReactDOM.unstable_batchedUpdates(() => {
        setFullData(prevData => [...prevData, ...nextData]);
        setCurrentPage(prevPage => prevPage + 1);
      });
    } catch (e) {}
  }, [currentPage]);

  return (
    <Layout>
      <>
        <SEO title="Keisei's Blog" />
        <InfiniteScroll
          next={loadingMore}
          hasMore={fullData.length < 50}
          loader={loading ? <h3>Loading...</h3> : null}
          dataLength={fullData.length}
        >
          <ol className="px-8">
            {fullData.map((topic, topicIndex) => (
              <li className="my-4" key={topic.title}>
                <div className="text-xl text-indigo-500">{topic.title}</div>
                {topic.lead ? (
                  <div className="pt-1 text-xs text-gray-500">{topic.lead}</div>
                ) : null}
                {topic.feedContent.length ? (
                  topicsExpand[topicIndex] ? (
                    <>
                      {topic.feedContent.map((feed, index) => (
                        <p
                          className="odd:bg-yellow-100 even:bg-white pt-1 text-sm text-purple-900"
                          key={index}
                        >
                          {feed}
                        </p>
                      ))}
                      <span
                        className="cursor-pointer"
                        onClick={() => updateTopicsExpand(topicIndex)}
                      >
                        收起
                      </span>
                    </>
                  ) : (
                    <span
                      className="cursor-pointer"
                      onClick={() => updateTopicsExpand(topicIndex)}
                    >
                      展开
                    </span>
                  )
                ) : null}
              </li>
            ))}
          </ol>
        </InfiniteScroll>
      </>
    </Layout>
  );
};

export default Weibo;
