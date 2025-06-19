import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock movie data for search functionality
const mockMovies = [
  {
    id: 299536,
    title: "Avengers: Infinity War",
    overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
    poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    backdrop_path: "/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
    release_date: "2018-04-25",
    vote_average: 8.3,
    vote_count: 28762,
    genre_ids: [28, 12, 878],
    adult: false,
    original_language: "en",
    original_title: "Avengers: Infinity War",
    popularity: 83.2,
    video: false
  },
  {
    id: 299537,
    title: "Captain Marvel",
    overview: "The story follows Carol Danvers as she becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races.",
    poster_path: "/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg",
    backdrop_path: "/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg",
    release_date: "2019-03-06",
    vote_average: 6.8,
    vote_count: 12420,
    genre_ids: [28, 12, 878],
    adult: false,
    original_language: "en",
    original_title: "Captain Marvel",
    popularity: 73.4,
    video: false
  },
  {
    id: 181808,
    title: "Star Wars: The Last Jedi",
    overview: "Rey develops her newly discovered abilities with the guidance of Luke Skywalker, who is unsettled by the strength of her powers.",
    poster_path: "/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
    backdrop_path: "/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg",
    release_date: "2017-12-13",
    vote_average: 7.0,
    vote_count: 14552,
    genre_ids: [28, 12, 14, 878],
    adult: false,
    original_language: "en",
    original_title: "Star Wars: The Last Jedi",
    popularity: 65.1,
    video: false
  },
  {
    id: 557,
    title: "Spider-Man",
    overview: "After being bitten by a genetically altered spider at Oscorp, nerdy but endearing high school student Peter Parker is endowed with amazing powers to become the superhero known as Spider-Man.",
    poster_path: "/gh4cZbhZxyTbgxQPxD0dOudNPTn.jpg",
    backdrop_path: "/2PDTWfuBWQKVC7aPAqJK5UCpz08.jpg",
    release_date: "2002-05-01",
    vote_average: 7.311,
    vote_count: 19647,
    genre_ids: [28, 878],
    adult: false,
    original_language: "en",
    original_title: "Spider-Man",
    popularity: 16.6782,
    video: false
  },
  {
    id: 315635,
    title: "Spider-Man: Homecoming",
    overview: "Following the events of Captain America: Civil War, Peter Parker, with the help of his mentor Tony Stark, tries to balance his life as an ordinary high school student in Queens, New York City, with fighting crime as his superhero alter ego Spider-Man as a new threat, the Vulture, emerges.",
    poster_path: "/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg",
    backdrop_path: "/tPpYGm2mVecue7Bk3gNVoSPA5qn.jpg",
    release_date: "2017-07-05",
    vote_average: 7.331,
    vote_count: 22254,
    genre_ids: [28, 12, 878],
    adult: false,
    original_language: "en",
    original_title: "Spider-Man: Homecoming",
    popularity: 17.2091,
    video: false
  },
  {
    id: 634649,
    title: "Spider-Man: No Way Home",
    overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man.",
    poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    backdrop_path: "/zD5v1E4joAzFvmAEytt7fM3ivyT.jpg",
    release_date: "2021-12-15",
    vote_average: 7.945,
    vote_count: 20821,
    genre_ids: [28, 12, 878],
    adult: false,
    original_language: "en",
    original_title: "Spider-Man: No Way Home",
    popularity: 25.7622,
    video: false
  }
];

const mockTVShows = [
  {
    id: 1399,
    name: "Game of Thrones",
    overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.",
    poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    first_air_date: "2011-04-17",
    vote_average: 8.3,
    vote_count: 22040,
    genre_ids: [18, 10765, 10759],
    adult: false,
    original_language: "en",
    original_name: "Game of Thrones",
    popularity: 369.594,
    video: false
  },
  {
    id: 1396,
    name: "Breaking Bad",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
    poster_path: "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    first_air_date: "2008-01-20",
    vote_average: 9.5,
    vote_count: 13172,
    genre_ids: [18, 80],
    adult: false,
    original_language: "en",
    original_name: "Breaking Bad",
    popularity: 451.564,
    video: false
  }
];

function searchMockData(query: string, type: 'movie' | 'tv') {
  const data = type === 'tv' ? mockTVShows : mockMovies;
  
  if (!query || query.trim() === '') {
    return data.slice(0, 10);
  }
  
  const searchTerm = query.toLowerCase();
  return data.filter(item => {
    const title = type === 'tv' ? (item as any).name : (item as any).title;
    return title.toLowerCase().includes(searchTerm) || 
           item.overview.toLowerCase().includes(searchTerm);
  });
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get('query') || '';
    const type = url.searchParams.get('type') || 'movie';
    const page = parseInt(url.searchParams.get('page') || '1');

    // Validate input
    if (query.length > 500) {
      return json({ error: 'Query too long' }, { status: 400 });
    }

    if (!['movie', 'tv'].includes(type)) {
      return json({ error: 'Invalid type' }, { status: 400 });
    }

    if (page < 1 || page > 100) {
      return json({ error: 'Invalid page' }, { status: 400 });
    }

    // Get mock results
    const results = searchMockData(query, type as 'movie' | 'tv');
    
    // Paginate results
    const itemsPerPage = 20;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = results.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: {
        data: {
          page,
          results: paginatedResults,
          total_pages: Math.ceil(results.length / itemsPerPage),
          total_results: results.length
        }
      },
      timestamp: new Date().toISOString()
    };

    return json(response);
  } catch (error) {
    console.error('Search error:', error);
    return json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}; 