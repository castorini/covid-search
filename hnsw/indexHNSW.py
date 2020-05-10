import os
import helper
import hnswlib
import numpy as np


class Indexer:
    def __init__(self, folder_path):
        self.folder_path = folder_path

    def get_path(self, path) -> str:
        return os.path.join(self.folder_path, path)

    def load_data(self) -> None:
        self.metadata_path = self.get_path('metadata.csv')
        self.metadata = helper.load_metadata(self.metadata_path)
        print('Metadata Length:', len(self.metadata))

        self.specter_path = self.get_path('specter.csv')
        self.embedding, self.DIM = helper.load_specter_embeddings(
            self.specter_path)
        print('Number of Embedding:', len(self.embedding))
        print('Embedding Dimension:', self.DIM)
        assert len(self.metadata) == len(self.embedding), "Data Size Mismatch"
        self.TOTAL_NUM_ELEMENTS = len(self.metadata)
        print('Total Elements:', self.TOTAL_NUM_ELEMENTS)

    def initialize_hnsw_index(self) -> None:
        # Declaring index
        # possible options are l2, cosine or ip
        self.HNSW = hnswlib.Index(space='l2', dim=self.DIM)

        # Initing index - the maximum number of elements should be known beforehand
        # For more configuration, see: https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md
        self.HNSW.init_index(
            max_elements=self.TOTAL_NUM_ELEMENTS,
            ef_construction=200,
            M=16)

    def index_and_save(self) -> None:
        print('>> [Pre-process] starting')
        data = np.empty((0, self.DIM))
        data_labels = []
        index_to_uid = []

        for index, uid in enumerate(self.embedding):
            if index % 200 == 0:
                print(
                    f'>> [Pre-process][{index}/{self.TOTAL_NUM_ELEMENTS}]')

            if index % 200 == 0 and len(data_labels) > 0:
                # save progress
                self._add_to_index(data, data_labels,  index)
                # reset
                data = np.empty((0, self.DIM))
                data_labels = []

            vector = self.embedding[uid]
            assert len(vector) == self.DIM, "Vector Dimension Mismatch"
            data = np.concatenate((data, [vector]))
            data_labels.append(index)
            index_to_uid.append(uid)

        if len(data_labels) > 0:
            self._add_to_index(data, data_labels, index)
            self._save_index(data, data_labels, index_to_uid, index)
            print(f'>> [Pre-process][{index + 1}/{self.TOTAL_NUM_ELEMENTS}]')

        print('<< [Pre-process] done')

    def _add_to_index(self, data, data_labels, index):
        print('>> [Pre-process] adding hnswlib index', index)
        # Element insertion (can be called several times)
        self.HNSW.add_items(data, data_labels)

    def _save_index(self, data, data_labels, index_to_uid, index):
        print('>> [Pre-process] saving hnswlib index', index)
        file_name = 'cord19-hnsw'
        output_path = self.get_path(f'{file_name}.bin')
        helper.remove_if_exist(output_path)
        self.HNSW.save_index(output_path)
        # Save index to uid file
        helper.save_index_to_uid_file(
            index_to_uid,
            index,
            self.get_path(f'{file_name}.txt'))


if __name__ == '__main__':
    indexer = Indexer("./api/index/cord19-hnsw-index")
    indexer.load_data()
    indexer.initialize_hnsw_index()
    indexer.index_and_save()
